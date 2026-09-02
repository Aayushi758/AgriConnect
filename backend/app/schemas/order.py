"""Order & Inventory schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# --- Inventory ---
class InventoryResponse(BaseModel):
    id: int
    product_id: int
    current_stock: float
    reserved_stock: float
    total_added: float
    total_sold: float
    total_returned: float
    low_stock_threshold: float
    updated_at: datetime

    class Config:
        from_attributes = True


class InventoryTransactionResponse(BaseModel):
    id: int
    inventory_id: int
    transaction_type: str
    quantity: float
    previous_stock: float
    new_stock: float
    reference_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StockAdjustment(BaseModel):
    quantity: float = Field(..., gt=0)
    notes: Optional[str] = None


# --- Cart ---
class CartItem(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0)


class CartRequest(BaseModel):
    items: List[CartItem]


# --- Order ---
class OrderCreate(BaseModel):
    items: List[CartItem]
    delivery_address: str
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    payment_method: str = "cod"
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    farmer_id: int
    product_name: str
    quantity: float
    unit_price: float
    total_price: float
    unit: str

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    order_number: str
    consumer_id: int
    status: str
    subtotal: float
    delivery_fee: float
    tax: float
    discount: float
    total: float
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    estimated_delivery_time: Optional[datetime] = None
    actual_delivery_time: Optional[datetime] = None
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None


# --- Payment ---
class PaymentResponse(BaseModel):
    id: int
    order_id: int
    payment_method: str
    status: str
    amount: float
    transaction_id: Optional[str] = None
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True
