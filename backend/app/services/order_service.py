"""Order service - order creation, inventory management, state transitions."""
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException

from app.models.order import Order, OrderItem, OrderStatus, Payment, PaymentMethod, PaymentStatus
from app.models.product import Product, ProductStatus
from app.models.inventory import Inventory, InventoryTransaction, TransactionType
from app.models.delivery import Delivery, DeliveryStatus
from app.models.user import ConsumerProfile, FarmerProfile
from app.schemas.order import OrderCreate


def create_order(db: Session, consumer_id: int, order_data: OrderCreate) -> Order:
    """Create order with inventory validation and reservation using DB transaction."""
    order_number = f"KS-{uuid.uuid4().hex[:8].upper()}"

    subtotal = 0.0
    order_items = []

    for item in order_data.items:
        # Lock the product row for update (prevents concurrent overselling)
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.status == ProductStatus.ACTIVE,
        ).with_for_update().first()

        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not available")

        # Check inventory
        inventory = db.query(Inventory).filter(
            Inventory.product_id == product.id
        ).with_for_update().first()

        if not inventory:
            raise HTTPException(status_code=400, detail=f"No inventory for product {product.name}")

        available = inventory.current_stock - inventory.reserved_stock
        if available < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}. Available: {available} {product.unit}"
            )

        if item.quantity < product.min_order_quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum order for {product.name} is {product.min_order_quantity} {product.unit}"
            )

        item_total = product.price * item.quantity
        subtotal += item_total

        order_items.append({
            "product": product,
            "inventory": inventory,
            "quantity": item.quantity,
            "unit_price": product.price,
            "total_price": item_total,
        })

    # Calculate totals
    delivery_fee = 30.0 if subtotal < 500 else 0.0
    tax = round(subtotal * 0.0, 2)  # No tax for MVP
    total = subtotal + delivery_fee + tax

    # Create order
    order = Order(
        order_number=order_number,
        consumer_id=consumer_id,
        status=OrderStatus.PENDING,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        tax=tax,
        total=total,
        delivery_address=order_data.delivery_address,
        delivery_latitude=order_data.delivery_latitude,
        delivery_longitude=order_data.delivery_longitude,
        notes=order_data.notes,
        estimated_delivery_time=datetime.utcnow() + timedelta(hours=2),
    )
    db.add(order)
    db.flush()

    # Create order items and reserve inventory
    for item_data in order_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product"].id,
            farmer_id=item_data["product"].farmer_id,
            product_name=item_data["product"].name,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            total_price=item_data["total_price"],
            unit=item_data["product"].unit.value if hasattr(item_data["product"].unit, 'value') else item_data["product"].unit,
        )
        db.add(order_item)

        # Reserve inventory
        inv = item_data["inventory"]
        prev_stock = inv.current_stock
        inv.reserved_stock += item_data["quantity"]

        # Log transaction
        tx = InventoryTransaction(
            inventory_id=inv.id,
            transaction_type=TransactionType.STOCK_RESERVED,
            quantity=item_data["quantity"],
            previous_stock=prev_stock,
            new_stock=prev_stock,
            reference_id=order.id,
            notes=f"Reserved for order {order_number}",
        )
        db.add(tx)

    # Create payment record
    payment = Payment(
        order_id=order.id,
        payment_method=PaymentMethod(order_data.payment_method) if order_data.payment_method in [e.value for e in PaymentMethod] else PaymentMethod.COD,
        status=PaymentStatus.PENDING,
        amount=total,
    )
    db.add(payment)

    db.commit()
    db.refresh(order)
    return order


def confirm_order(db: Session, order_id: int) -> Order:
    """Confirm order - deduct inventory from current stock."""
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Cannot confirm order in {order.status} state")

    order.status = OrderStatus.CONFIRMED

    for item in order.items:
        inventory = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
        if inventory:
            prev_stock = inventory.current_stock
            inventory.current_stock -= item.quantity
            inventory.reserved_stock -= item.quantity
            inventory.total_sold += item.quantity

            # Prevent negative stock
            inventory.current_stock = max(0, inventory.current_stock)
            inventory.reserved_stock = max(0, inventory.reserved_stock)

            tx = InventoryTransaction(
                inventory_id=inventory.id,
                transaction_type=TransactionType.STOCK_SOLD,
                quantity=item.quantity,
                previous_stock=prev_stock,
                new_stock=inventory.current_stock,
                reference_id=order.id,
                notes=f"Sold via order {order.order_number}",
            )
            db.add(tx)

            # Update product
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.available_quantity = inventory.current_stock
                product.total_sold += item.quantity
                product.total_revenue += item.total_price
                if inventory.current_stock <= 0:
                    product.status = ProductStatus.OUT_OF_STOCK

    # Update payment
    if order.payment:
        order.payment.status = PaymentStatus.COMPLETED
        order.payment.paid_at = datetime.utcnow()
        order.payment.transaction_id = f"MOCK-{uuid.uuid4().hex[:12].upper()}"

    db.commit()
    db.refresh(order)
    return order


def update_order_status(db: Session, order_id: int, new_status: str, reason: Optional[str] = None) -> Order:
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    valid_transitions = {
        OrderStatus.PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        OrderStatus.CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
        OrderStatus.PREPARING: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
        OrderStatus.READY_FOR_PICKUP: [OrderStatus.OUT_FOR_DELIVERY],
        OrderStatus.OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
        OrderStatus.DELIVERED: [OrderStatus.RETURN_REQUESTED],
        OrderStatus.RETURN_REQUESTED: [OrderStatus.RETURNED],
    }

    current_valid = valid_transitions.get(order.status, [])
    target_status = OrderStatus(new_status)

    if target_status not in current_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {order.status.value} to {new_status}"
        )

    if target_status == OrderStatus.CANCELLED:
        order.cancelled_at = datetime.utcnow()
        order.cancellation_reason = reason
        # Release reserved inventory
        for item in order.items:
            inventory = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
            if inventory:
                prev = inventory.current_stock
                if order.status == OrderStatus.PENDING:
                    inventory.reserved_stock = max(0, inventory.reserved_stock - item.quantity)
                else:
                    inventory.current_stock += item.quantity
                    inventory.total_sold = max(0, inventory.total_sold - item.quantity)
                    product = db.query(Product).filter(Product.id == item.product_id).first()
                    if product:
                        product.available_quantity = inventory.current_stock
                        if product.status == ProductStatus.OUT_OF_STOCK and inventory.current_stock > 0:
                            product.status = ProductStatus.ACTIVE

                tx = InventoryTransaction(
                    inventory_id=inventory.id,
                    transaction_type=TransactionType.STOCK_RELEASED,
                    quantity=item.quantity,
                    previous_stock=prev,
                    new_stock=inventory.current_stock,
                    reference_id=order.id,
                    notes=f"Released due to cancellation: {reason or 'No reason'}",
                )
                db.add(tx)

        if order.payment and order.payment.status == PaymentStatus.COMPLETED:
            order.payment.status = PaymentStatus.REFUNDED

    elif target_status == OrderStatus.RETURNED:
        # Return stock
        for item in order.items:
            inventory = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
            if inventory:
                prev = inventory.current_stock
                inventory.current_stock += item.quantity
                inventory.total_returned += item.quantity
                tx = InventoryTransaction(
                    inventory_id=inventory.id,
                    transaction_type=TransactionType.STOCK_RETURNED,
                    quantity=item.quantity,
                    previous_stock=prev,
                    new_stock=inventory.current_stock,
                    reference_id=order.id,
                    notes=f"Returned from order {order.order_number}",
                )
                db.add(tx)

                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.available_quantity = inventory.current_stock
                    if product.status == ProductStatus.OUT_OF_STOCK:
                        product.status = ProductStatus.ACTIVE

    elif target_status == OrderStatus.DELIVERED:
        order.actual_delivery_time = datetime.utcnow()

    order.status = target_status
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return order


def get_consumer_orders(db: Session, consumer_id: int) -> List[Order]:
    return db.query(Order).options(
        joinedload(Order.items), joinedload(Order.payment), joinedload(Order.delivery)
    ).filter(Order.consumer_id == consumer_id).order_by(Order.created_at.desc()).all()


def get_farmer_orders(db: Session, farmer_id: int) -> List[Order]:
    """Get all orders containing products from this farmer."""
    return db.query(Order).options(
        joinedload(Order.items), joinedload(Order.payment), joinedload(Order.consumer)
    ).join(OrderItem).filter(
        OrderItem.farmer_id == farmer_id
    ).distinct().order_by(Order.created_at.desc()).all()


def get_order_by_id(db: Session, order_id: int) -> Optional[Order]:
    return db.query(Order).options(
        joinedload(Order.items), joinedload(Order.payment), joinedload(Order.delivery)
    ).filter(Order.id == order_id).first()
