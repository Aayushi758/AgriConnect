"""Dashboard service - farmer analytics and metrics."""
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.product import Product, ProductStatus
from app.models.inventory import Inventory, InventoryTransaction
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import FarmerProfile


def get_farmer_dashboard(db: Session, farmer_id: int) -> Dict[str, Any]:
    """Get comprehensive dashboard metrics for a farmer."""
    
    # Product stats
    total_products = db.query(func.count(Product.id)).filter(
        Product.farmer_id == farmer_id
    ).scalar() or 0
    
    active_products = db.query(func.count(Product.id)).filter(
        Product.farmer_id == farmer_id,
        Product.status == ProductStatus.ACTIVE,
    ).scalar() or 0
    
    out_of_stock = db.query(func.count(Product.id)).filter(
        Product.farmer_id == farmer_id,
        Product.status == ProductStatus.OUT_OF_STOCK,
    ).scalar() or 0

    # Inventory stats
    inventory_data = db.query(
        func.sum(Inventory.current_stock),
        func.sum(Inventory.total_sold),
        func.sum(Inventory.total_returned),
    ).join(Product, Product.id == Inventory.product_id).filter(
        Product.farmer_id == farmer_id
    ).first()
    
    total_inventory = inventory_data[0] or 0
    total_sold = inventory_data[1] or 0
    total_returned = inventory_data[2] or 0

    # Revenue & sales stats
    sales_data = db.query(
        func.sum(OrderItem.total_price),
        func.count(func.distinct(OrderItem.order_id)),
    ).filter(OrderItem.farmer_id == farmer_id).first()
    
    total_revenue = sales_data[0] or 0
    total_orders = sales_data[1] or 0

    # Price stats
    price_stats = db.query(
        func.max(Product.price),
        func.min(Product.price),
        func.avg(Product.price),
    ).filter(Product.farmer_id == farmer_id).first()
    
    max_price = price_stats[0] or 0
    min_price = price_stats[1] or 0
    avg_price = round(price_stats[2] or 0, 2)

    # Order status breakdown
    order_statuses = {}
    for status in OrderStatus:
        count = db.query(func.count(func.distinct(Order.id))).join(
            OrderItem
        ).filter(
            OrderItem.farmer_id == farmer_id,
            Order.status == status,
        ).scalar() or 0
        order_statuses[status.value] = count

    # Production cost (if farmer has entered it)
    farmer = db.query(FarmerProfile).filter(FarmerProfile.id == farmer_id).first()
    production_cost = farmer.production_cost_per_kg if farmer else None
    
    estimated_cost = 0
    estimated_profit = total_revenue
    if production_cost and total_sold > 0:
        estimated_cost = production_cost * total_sold
        estimated_profit = total_revenue - estimated_cost

    # Per-product inventory
    product_inventory = []
    products = db.query(Product).filter(Product.farmer_id == farmer_id).all()
    for p in products:
        inv = db.query(Inventory).filter(Inventory.product_id == p.id).first()
        product_inventory.append({
            "product_id": p.id,
            "product_name": p.name,
            "price": p.price,
            "unit": p.unit.value if hasattr(p.unit, 'value') else p.unit,
            "current_stock": inv.current_stock if inv else 0,
            "total_sold": inv.total_sold if inv else 0,
            "total_revenue": p.total_revenue,
            "status": p.status.value if hasattr(p.status, 'value') else p.status,
        })

    # Recent sales (last 30 days trend)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_sales = db.query(
        func.date(Order.created_at).label("date"),
        func.sum(OrderItem.total_price).label("revenue"),
        func.count(func.distinct(Order.id)).label("orders"),
    ).join(OrderItem).filter(
        OrderItem.farmer_id == farmer_id,
        Order.created_at >= thirty_days_ago,
        Order.status.notin_([OrderStatus.CANCELLED, OrderStatus.RETURNED]),
    ).group_by(func.date(Order.created_at)).all()

    sales_trend = [
        {"date": str(s.date), "revenue": s.revenue or 0, "orders": s.orders or 0}
        for s in recent_sales
    ]

    return {
        "overview": {
            "total_products": total_products,
            "active_products": active_products,
            "out_of_stock": out_of_stock,
            "total_inventory": round(total_inventory, 2),
            "total_sold": round(total_sold, 2),
            "total_returned": round(total_returned, 2),
            "total_revenue": round(total_revenue, 2),
            "total_orders": total_orders,
            "max_price": round(max_price, 2),
            "min_price": round(min_price, 2),
            "avg_price": avg_price,
            "estimated_cost": round(estimated_cost, 2),
            "estimated_profit": round(estimated_profit, 2),
            "production_cost_per_kg": production_cost,
        },
        "order_statuses": order_statuses,
        "product_inventory": product_inventory,
        "sales_trend": sales_trend,
    }
