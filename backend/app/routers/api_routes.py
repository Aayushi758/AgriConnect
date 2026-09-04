"""Order, Inventory, Dashboard, Delivery, Chat, Support, AI, Weather routes."""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import get_current_user, require_farmer, require_consumer
from app.services.order_service import (
    create_order, confirm_order, update_order_status,
    get_consumer_orders, get_farmer_orders, get_order_by_id,
)
from app.services.dashboard_service import get_farmer_dashboard
from app.models.user import User, FarmerProfile, ConsumerProfile
from app.models.inventory import Inventory, InventoryTransaction, TransactionType
from app.models.order import Order, OrderItem, OrderStatus
from app.models.delivery import Delivery, DeliveryRoute, DeliveryStatus, DeliveryLocationUpdate
from app.models.chat import ChatConversation, ChatMessage
from app.models.support import SupportRequest, SupportCategory, SupportStatus
from app.schemas.order import (
    OrderCreate, OrderResponse, OrderStatusUpdate,
    InventoryResponse, InventoryTransactionResponse, StockAdjustment,
)
from app.schemas.common import (
    DeliveryResponse, DeliveryTrackingResponse,
    ChatConversationCreate, ChatConversationResponse, ChatMessageCreate, ChatMessageResponse,
    SupportRequestCreate, SupportRequestResponse,
    PriceIntelligenceRequest, PriceIntelligenceResponse, PricePredictionResponse,
    CropRecommendationResponse, DemandForecastResponse,
    WeatherResponse, AssistantMessage, AssistantResponse,
)
from app.ml.price_prediction import get_price_intelligence, predict_prices
from app.ml.demand_forecasting import forecast_demand
from app.ml.crop_recommendation import recommend_crops
from app.providers.weather_provider import get_weather_provider
from app.providers.llm_provider import get_llm_provider
from app.providers.routing_provider import get_routing_provider

import json
import uuid

# =================== ORDERS ===================
orders_router = APIRouter(prefix="/api/orders", tags=["Orders"])


@orders_router.post("/", response_model=OrderResponse)
def place_order(order_data: OrderCreate, current_user: User = Depends(require_consumer),
                db: Session = Depends(get_db)):
    """Place a new order."""
    profile = db.query(ConsumerProfile).filter(ConsumerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Consumer profile not found")
    order = create_order(db, profile.id, order_data)
    
    # Auto-confirm for demo
    order = confirm_order(db, order.id)
    
    # Create delivery
    _create_delivery_for_order(db, order)
    
    return OrderResponse.model_validate(order)


def _create_delivery_for_order(db: Session, order: Order):
    """Create delivery record and route for an order."""
    # Get farmer location from first item
    first_item = order.items[0] if order.items else None
    if not first_item:
        return
    
    farmer_profile = db.query(FarmerProfile).filter(FarmerProfile.id == first_item.farmer_id).first()
    if not farmer_profile:
        return
    
    delivery = Delivery(
        order_id=order.id,
        status=DeliveryStatus.ASSIGNED,
        pickup_address=farmer_profile.address,
        pickup_latitude=farmer_profile.latitude or 18.52,
        pickup_longitude=farmer_profile.longitude or 73.85,
        delivery_address=order.delivery_address,
        delivery_latitude=order.delivery_latitude or 18.53,
        delivery_longitude=order.delivery_longitude or 73.87,
        current_latitude=farmer_profile.latitude or 18.52,
        current_longitude=farmer_profile.longitude or 73.85,
        agent_name=f"Delivery Partner #{order.id}",
        agent_phone=f"9876500{order.id:03d}",
    )
    db.add(delivery)
    db.flush()
    
    # Generate route
    import asyncio
    routing = get_routing_provider()
    try:
        loop = asyncio.new_event_loop()
        route_data = loop.run_until_complete(routing.get_route(
            (delivery.pickup_latitude, delivery.pickup_longitude),
            (delivery.delivery_latitude, delivery.delivery_longitude),
        ))
        loop.close()
    except Exception:
        route_data = {
            "coordinates": [[delivery.pickup_latitude, delivery.pickup_longitude],
                           [delivery.delivery_latitude, delivery.delivery_longitude]],
            "total_distance_km": 5.0,
            "total_duration_minutes": 30.0,
        }
    
    delivery.distance_km = route_data["total_distance_km"]
    delivery.distance_remaining_km = route_data["total_distance_km"]
    delivery.estimated_arrival = datetime.utcnow() + __import__('datetime').timedelta(
        minutes=route_data["total_duration_minutes"]
    )
    
    route = DeliveryRoute(
        delivery_id=delivery.id,
        route_coordinates=json.dumps(route_data["coordinates"]),
        total_distance_km=route_data["total_distance_km"],
        total_duration_minutes=route_data["total_duration_minutes"],
        provider="mock",
    )
    db.add(route)
    db.commit()


@orders_router.get("/my-orders", response_model=List[OrderResponse])
def my_orders(current_user: User = Depends(require_consumer), db: Session = Depends(get_db)):
    profile = db.query(ConsumerProfile).filter(ConsumerProfile.user_id == current_user.id).first()
    orders = get_consumer_orders(db, profile.id)
    return [OrderResponse.model_validate(o) for o in orders]


@orders_router.get("/farmer-orders", response_model=List[OrderResponse])
def farmer_orders_list(current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    orders = get_farmer_orders(db, profile.id)
    return [OrderResponse.model_validate(o) for o in orders]


@orders_router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.model_validate(order)


@orders_router.put("/{order_id}/status")
def change_order_status(order_id: int, status_update: OrderStatusUpdate,
                        current_user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    order = update_order_status(db, order_id, status_update.status, status_update.reason)
    return OrderResponse.model_validate(order)


# =================== INVENTORY ===================
inventory_router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@inventory_router.get("/", response_model=List[InventoryResponse])
def get_inventory(current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    from app.models.product import Product
    inventories = db.query(Inventory).join(Product).filter(Product.farmer_id == profile.id).all()
    return [InventoryResponse.model_validate(inv) for inv in inventories]


@inventory_router.get("/{product_id}/transactions", response_model=List[InventoryTransactionResponse])
def get_transactions(product_id: int, current_user: User = Depends(require_farmer),
                     db: Session = Depends(get_db)):
    inv = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
    txs = db.query(InventoryTransaction).filter(
        InventoryTransaction.inventory_id == inv.id
    ).order_by(InventoryTransaction.created_at.desc()).all()
    return [InventoryTransactionResponse.model_validate(tx) for tx in txs]


@inventory_router.post("/{product_id}/add-stock")
def add_stock(product_id: int, adjustment: StockAdjustment,
              current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    inv = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    prev = inv.current_stock
    inv.current_stock += adjustment.quantity
    inv.total_added += adjustment.quantity
    
    from app.models.product import Product, ProductStatus
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        product.available_quantity = inv.current_stock
        if product.status == ProductStatus.OUT_OF_STOCK and inv.current_stock > 0:
            product.status = ProductStatus.ACTIVE
    
    tx = InventoryTransaction(
        inventory_id=inv.id,
        transaction_type=TransactionType.STOCK_ADDED,
        quantity=adjustment.quantity,
        previous_stock=prev,
        new_stock=inv.current_stock,
        notes=adjustment.notes or "Manual stock addition",
    )
    db.add(tx)
    db.commit()
    return {"message": "Stock added", "new_stock": inv.current_stock}


# =================== DASHBOARD ===================
dashboard_router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@dashboard_router.get("/farmer")
def farmer_dashboard(current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
    return get_farmer_dashboard(db, profile.id)


# =================== DELIVERY ===================
delivery_router = APIRouter(prefix="/api/delivery", tags=["Delivery"])


@delivery_router.get("/{order_id}")
def get_delivery_tracking(order_id: int, current_user: User = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    delivery = db.query(Delivery).filter(Delivery.order_id == order_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    route = db.query(DeliveryRoute).filter(DeliveryRoute.delivery_id == delivery.id).first()
    
    # Calculate progress
    progress = 0
    if delivery.distance_km and delivery.distance_remaining_km is not None:
        progress = max(0, min(100, ((delivery.distance_km - delivery.distance_remaining_km) / delivery.distance_km) * 100))
    
    route_coords = None
    if route and route.route_coordinates:
        try:
            route_coords = json.loads(route.route_coordinates)
        except (json.JSONDecodeError, TypeError):
            route_coords = None
    
    return {
        "delivery": {
            "id": delivery.id,
            "order_id": delivery.order_id,
            "status": delivery.status.value if hasattr(delivery.status, 'value') else delivery.status,
            "pickup_latitude": delivery.pickup_latitude,
            "pickup_longitude": delivery.pickup_longitude,
            "delivery_latitude": delivery.delivery_latitude,
            "delivery_longitude": delivery.delivery_longitude,
            "current_latitude": delivery.current_latitude,
            "current_longitude": delivery.current_longitude,
            "distance_km": delivery.distance_km,
            "distance_remaining_km": delivery.distance_remaining_km,
            "estimated_arrival": str(delivery.estimated_arrival) if delivery.estimated_arrival else None,
            "agent_name": delivery.agent_name,
            "agent_phone": delivery.agent_phone,
        },
        "route_coordinates": route_coords,
        "total_distance_km": route.total_distance_km if route else None,
        "total_duration_minutes": route.total_duration_minutes if route else None,
        "progress_percent": round(progress, 1),
        "is_simulated": True,
    }


@delivery_router.post("/{order_id}/simulate-step")
def simulate_delivery_step(order_id: int, current_user: User = Depends(get_current_user),
                           db: Session = Depends(get_db)):
    """Simulate one step of delivery movement along the route."""
    delivery = db.query(Delivery).filter(Delivery.order_id == order_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    route = db.query(DeliveryRoute).filter(DeliveryRoute.delivery_id == delivery.id).first()
    if not route or not route.route_coordinates:
        return {"message": "No route available"}
    
    try:
        coords = json.loads(route.route_coordinates)
    except (json.JSONDecodeError, TypeError):
        return {"message": "Invalid route data"}
    
    if not coords:
        return {"message": "Empty route"}
    
    # Find current position index
    current_idx = 0
    min_dist = float('inf')
    for i, coord in enumerate(coords):
        dist = ((coord[0] - (delivery.current_latitude or 0))**2 + 
                (coord[1] - (delivery.current_longitude or 0))**2)
        if dist < min_dist:
            min_dist = dist
            current_idx = i
    
    # Move to next point(s)
    next_idx = min(current_idx + max(1, len(coords) // 10), len(coords) - 1)
    new_lat = coords[next_idx][0]
    new_lng = coords[next_idx][1]
    
    delivery.current_latitude = new_lat
    delivery.current_longitude = new_lng
    
    # Update remaining distance
    if delivery.distance_km:
        progress = next_idx / max(1, len(coords) - 1)
        delivery.distance_remaining_km = delivery.distance_km * (1 - progress)
    
    # Update status based on progress
    progress_pct = next_idx / max(1, len(coords) - 1)
    if progress_pct >= 1.0:
        delivery.status = DeliveryStatus.DELIVERED
        delivery.delivered_at = datetime.utcnow()
        delivery.distance_remaining_km = 0
        # Update order
        order = db.query(Order).filter(Order.id == order_id).first()
        if order:
            order.status = OrderStatus.DELIVERED
            order.actual_delivery_time = datetime.utcnow()
    elif progress_pct >= 0.8:
        delivery.status = DeliveryStatus.NEARBY
    elif progress_pct > 0:
        delivery.status = DeliveryStatus.IN_TRANSIT
    
    # Log location update
    loc_update = DeliveryLocationUpdate(
        delivery_id=delivery.id,
        latitude=new_lat,
        longitude=new_lng,
        is_simulated=1,
    )
    db.add(loc_update)
    db.commit()
    
    return {
        "current_latitude": new_lat,
        "current_longitude": new_lng,
        "progress_percent": round(progress_pct * 100, 1),
        "status": delivery.status.value if hasattr(delivery.status, 'value') else delivery.status,
        "distance_remaining_km": round(delivery.distance_remaining_km or 0, 2),
        "is_simulated": True,
    }


# =================== CHAT ===================
chat_router = APIRouter(prefix="/api/chat", tags=["Chat"])


@chat_router.post("/conversations")
def create_conversation(conv_data: ChatConversationCreate,
                        current_user: User = Depends(require_consumer),
                        db: Session = Depends(get_db)):
    consumer_profile = db.query(ConsumerProfile).filter(ConsumerProfile.user_id == current_user.id).first()
    
    conv = ChatConversation(
        farmer_id=conv_data.farmer_id,
        consumer_id=consumer_profile.id,
        product_id=conv_data.product_id,
        subject=conv_data.subject,
        is_bulk_inquiry=conv_data.is_bulk_inquiry,
    )
    db.add(conv)
    db.flush()
    
    msg = ChatMessage(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=conv_data.initial_message,
    )
    db.add(msg)
    db.commit()
    db.refresh(conv)
    
    return {"id": conv.id, "message": "Conversation created"}


@chat_router.get("/conversations")
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farmer_profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    consumer_profile = db.query(ConsumerProfile).filter(ConsumerProfile.user_id == current_user.id).first()
    
    query = db.query(ChatConversation)
    if farmer_profile:
        query = query.filter(ChatConversation.farmer_id == farmer_profile.id)
    elif consumer_profile:
        query = query.filter(ChatConversation.consumer_id == consumer_profile.id)
    else:
        return []
    
    convs = query.order_by(ChatConversation.last_message_at.desc()).all()
    
    results = []
    for conv in convs:
        last_msg = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conv.id
        ).order_by(ChatMessage.created_at.desc()).first()
        
        # Get other user's name
        if farmer_profile:
            other = db.query(ConsumerProfile).filter(ConsumerProfile.id == conv.consumer_id).first()
            other_name = db.query(User).filter(User.id == other.user_id).first().full_name if other else "Consumer"
        else:
            other = db.query(FarmerProfile).filter(FarmerProfile.id == conv.farmer_id).first()
            other_name = db.query(User).filter(User.id == other.user_id).first().full_name if other else "Farmer"
        
        unread = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conv.id,
            ChatMessage.sender_id != current_user.id,
            ChatMessage.is_read == False,
        ).count()
        
        results.append({
            "id": conv.id,
            "other_user_name": other_name,
            "subject": conv.subject,
            "is_bulk_inquiry": conv.is_bulk_inquiry,
            "last_message": last_msg.content[:100] if last_msg else "",
            "last_message_at": str(conv.last_message_at),
            "unread_count": unread,
        })
    
    return results


@chat_router.get("/conversations/{conv_id}/messages")
def get_messages(conv_id: int, current_user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    # Mark messages as read
    db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conv_id,
        ChatMessage.sender_id != current_user.id,
        ChatMessage.is_read == False,
    ).update({"is_read": True})
    db.commit()
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conv_id
    ).order_by(ChatMessage.created_at).all()
    
    return [{
        "id": m.id,
        "sender_id": m.sender_id,
        "content": m.content,
        "is_read": m.is_read,
        "is_mine": m.sender_id == current_user.id,
        "created_at": str(m.created_at),
    } for m in messages]


@chat_router.post("/conversations/{conv_id}/messages")
def send_message(conv_id: int, msg_data: ChatMessageCreate,
                 current_user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    conv = db.query(ChatConversation).filter(ChatConversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    msg = ChatMessage(
        conversation_id=conv_id,
        sender_id=current_user.id,
        content=msg_data.content,
        message_type=msg_data.message_type,
    )
    db.add(msg)
    conv.last_message_at = datetime.utcnow()
    db.commit()
    
    return {"id": msg.id, "message": "Message sent"}


# =================== SUPPORT ===================
support_router = APIRouter(prefix="/api/support", tags=["Support"])


@support_router.post("/", response_model=SupportRequestResponse)
def create_support_request(req_data: SupportRequestCreate,
                           current_user: User = Depends(get_current_user),
                           db: Session = Depends(get_db)):
    sr = SupportRequest(
        user_id=current_user.id,
        order_id=req_data.order_id,
        category=SupportCategory(req_data.category) if req_data.category in [e.value for e in SupportCategory] else SupportCategory.OTHER,
        subject=req_data.subject,
        description=req_data.description,
    )
    db.add(sr)
    db.commit()
    db.refresh(sr)
    return SupportRequestResponse.model_validate(sr)


@support_router.get("/", response_model=List[SupportRequestResponse])
def list_support_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = db.query(SupportRequest).filter(
        SupportRequest.user_id == current_user.id
    ).order_by(SupportRequest.created_at.desc()).all()
    return [SupportRequestResponse.model_validate(r) for r in requests]


# =================== AI / ML ===================
ai_router = APIRouter(prefix="/api/ai", tags=["AI & ML"])


@ai_router.post("/price-intelligence")
def price_intelligence(req: PriceIntelligenceRequest, db: Session = Depends(get_db)):
    return get_price_intelligence(db, req.crop_name, req.current_selling_price, req.location)


@ai_router.get("/price-prediction/{crop_name}")
def price_prediction(crop_name: str, days: int = 7, location: Optional[str] = None,
                     db: Session = Depends(get_db)):
    return predict_prices(db, crop_name, days, location)


@ai_router.get("/demand-forecast/{crop_name}")
def demand_forecast(crop_name: str, weeks: int = 4, location: Optional[str] = None,
                    db: Session = Depends(get_db)):
    return forecast_demand(db, crop_name, weeks, location)


@ai_router.get("/crop-recommendations")
def crop_recommendations(location: Optional[str] = None, season: Optional[str] = None,
                         top_n: int = 5, db: Session = Depends(get_db)):
    return recommend_crops(db, location, season, top_n)


@ai_router.post("/assistant")
async def ai_assistant(msg: AssistantMessage, current_user: User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    llm = get_llm_provider()
    
    context = msg.context or {}
    
    # Enrich context with user data if relevant
    msg_lower = msg.message.lower()
    
    if any(w in msg_lower for w in ["order", "status"]):
        # Try to get user's orders
        if current_user.role.value == "consumer":
            profile = db.query(ConsumerProfile).filter(ConsumerProfile.user_id == current_user.id).first()
            if profile:
                recent_order = db.query(Order).filter(
                    Order.consumer_id == profile.id
                ).order_by(Order.created_at.desc()).first()
                if recent_order:
                    context["order_data"] = {
                        "order_number": recent_order.order_number,
                        "status": recent_order.status.value if hasattr(recent_order.status, 'value') else recent_order.status,
                        "total": recent_order.total,
                        "estimated_delivery_time": str(recent_order.estimated_delivery_time) if recent_order.estimated_delivery_time else None,
                    }
    
    response = await llm.generate(
        msg.message,
        system_prompt="You are AgriConnect's AI assistant helping farmers and consumers.",
        context=context,
    )
    
    return AssistantResponse(
        response=response,
        suggestions=["Check market prices", "View weather forecast", "Crop recommendations"],
    )


# =================== WEATHER ===================
weather_router = APIRouter(prefix="/api/weather", tags=["Weather"])


@weather_router.get("/current/{location}")
async def get_current_weather(location: str, db: Session = Depends(get_db)):
    provider = get_weather_provider(db)
    return await provider.get_current(location)


@weather_router.get("/forecast/{location}")
async def get_weather_forecast(location: str, days: int = 7, db: Session = Depends(get_db)):
    provider = get_weather_provider(db)
    return await provider.get_forecast(location, days)
