"""Weather data model."""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Text,
    Index
)
from app.database import Base


class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    temperature_c = Column(Float, nullable=True)
    humidity_percent = Column(Float, nullable=True)
    rainfall_mm = Column(Float, nullable=True)
    wind_speed_kmh = Column(Float, nullable=True)
    condition = Column(String(100), nullable=True)  # sunny, cloudy, rainy, etc.
    condition_icon = Column(String(50), nullable=True)
    forecast_date = Column(Date, nullable=False)
    is_forecast = Column(Integer, default=0)  # 0 = current, 1 = forecast
    source = Column(String(50), default="mock")
    agricultural_insight = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_weather_location_date", "location", "forecast_date"),
    )
