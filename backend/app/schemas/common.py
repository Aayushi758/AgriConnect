"""Delivery, Chat, Support, Weather, ML schemas."""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


# --- Delivery ---
class DeliveryResponse(BaseModel):
    id: int
    order_id: int
    status: str
    pickup_address: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    delivery_address: Optional[str] = None
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    distance_km: Optional[float] = None
    distance_remaining_km: Optional[float] = None
    estimated_arrival: Optional[datetime] = None
    agent_name: Optional[str] = None
    agent_phone: Optional[str] = None
    route_coordinates: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DeliveryTrackingResponse(BaseModel):
    delivery: DeliveryResponse
    route_polyline: Optional[str] = None
    route_coordinates: Optional[List[List[float]]] = None
    total_distance_km: Optional[float] = None
    total_duration_minutes: Optional[float] = None
    progress_percent: float = 0
    is_simulated: bool = True


# --- Chat ---
class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    message_type: str = "text"


class ChatMessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    message_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatConversationCreate(BaseModel):
    farmer_id: int
    product_id: Optional[int] = None
    subject: Optional[str] = None
    is_bulk_inquiry: bool = False
    initial_message: str = Field(..., min_length=1, max_length=2000)


class ChatConversationResponse(BaseModel):
    id: int
    farmer_id: int
    consumer_id: int
    product_id: Optional[int] = None
    subject: Optional[str] = None
    is_bulk_inquiry: bool
    is_active: bool
    last_message_at: datetime
    messages: List[ChatMessageResponse] = []
    other_user_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Support ---
class SupportRequestCreate(BaseModel):
    category: str
    subject: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10, max_length=2000)
    order_id: Optional[int] = None


class SupportRequestResponse(BaseModel):
    id: int
    user_id: int
    order_id: Optional[int] = None
    category: str
    subject: str
    description: str
    status: str
    resolution: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Weather ---
class WeatherResponse(BaseModel):
    location: str
    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    rainfall_mm: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    condition: Optional[str] = None
    condition_icon: Optional[str] = None
    forecast_date: date
    is_forecast: bool = False
    agricultural_insight: Optional[str] = None
    source: str = "mock"


# --- Price Intelligence ---
class PriceIntelligenceRequest(BaseModel):
    crop_name: str
    location: Optional[str] = None
    current_selling_price: Optional[float] = None


class PriceIntelligenceResponse(BaseModel):
    crop_name: str
    current_market_price: float
    farmer_selling_price: Optional[float] = None
    price_comparison: str  # "above", "below", "at_market"
    suggested_price_min: float
    suggested_price_max: float
    explanation: str
    confidence: float
    data_source: str = "synthetic"


class PricePredictionResponse(BaseModel):
    crop_name: str
    predicted_prices: List[dict]  # [{date, predicted_price, confidence}]
    trend: str  # "rising", "stable", "falling"
    explanation: str
    model_used: str
    data_source: str = "synthetic"


# --- Crop Recommendation ---
class CropRecommendationResponse(BaseModel):
    recommended_crop: str
    reason: str
    expected_demand: float
    expected_price_trend: str
    confidence_score: float
    assumptions: str
    season: Optional[str] = None
    location: Optional[str] = None


# --- Demand Forecast ---
class DemandForecastResponse(BaseModel):
    crop_name: str
    forecasted_demand: List[dict]  # [{date, demand, confidence}]
    trend: str
    explanation: str
    model_used: str
    data_source: str = "synthetic"


# --- AI Assistant ---
class AssistantMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    context: Optional[dict] = None  # Optional context like product_id, order_id


class AssistantResponse(BaseModel):
    response: str
    data: Optional[dict] = None  # Structured data if applicable
    suggestions: List[str] = []
