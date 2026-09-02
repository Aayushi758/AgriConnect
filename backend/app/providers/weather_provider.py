"""Weather provider interface with mock implementation."""
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
import random
import math
from sqlalchemy.orm import Session

from app.models.weather import WeatherData
from app.config import get_settings

settings = get_settings()


class WeatherProvider(ABC):
    @abstractmethod
    async def get_current(self, location: str) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def get_forecast(self, location: str, days: int = 7) -> List[Dict[str, Any]]:
        pass


class MockWeatherProvider(WeatherProvider):
    """Mock weather using stored synthetic data."""
    
    async def get_current(self, location: str) -> Dict[str, Any]:
        return self._generate_weather(location, date.today(), is_forecast=False)
    
    async def get_forecast(self, location: str, days: int = 7) -> List[Dict[str, Any]]:
        today = date.today()
        return [
            self._generate_weather(location, today + timedelta(days=i), is_forecast=True)
            for i in range(1, days + 1)
        ]
    
    def _generate_weather(self, location: str, d: date, is_forecast: bool) -> Dict[str, Any]:
        month = d.month
        base_temp = {1: 15, 2: 18, 3: 25, 4: 32, 5: 38, 6: 35,
                     7: 30, 8: 28, 9: 28, 10: 28, 11: 22, 12: 17}
        
        temp = base_temp[month] + random.gauss(0, 2)
        monsoon_rain = {1: 5, 2: 3, 3: 5, 4: 10, 5: 15, 6: 80,
                        7: 150, 8: 130, 9: 100, 10: 40, 11: 15, 12: 8}
        rainfall = max(0, monsoon_rain[month] * random.uniform(0.3, 1.5) / 30)
        
        if rainfall > 5:
            condition = random.choice(["Heavy Rain", "Thunderstorm"])
            icon = "🌧️"
        elif rainfall > 1:
            condition = "Light Rain"
            icon = "🌦️"
        elif temp > 35:
            condition = "Sunny"
            icon = "☀️"
        else:
            condition = random.choice(["Sunny", "Partly Cloudy", "Clear"])
            icon = {"Sunny": "☀️", "Partly Cloudy": "⛅", "Clear": "🌙"}.get(condition, "☀️")
        
        insights = []
        if temp > 35: insights.append("High temperature - ensure adequate irrigation.")
        if temp < 10: insights.append("Frost risk - protect sensitive crops.")
        if rainfall > 5: insights.append("Heavy rain - delay spraying and harvesting.")
        if 25 <= temp <= 30 and rainfall < 2: insights.append("Ideal growing conditions.")
        
        return {
            "location": location,
            "temperature_c": round(temp, 1),
            "humidity_percent": round(random.uniform(40, 90), 1),
            "rainfall_mm": round(rainfall, 1),
            "wind_speed_kmh": round(random.uniform(5, 25), 1),
            "condition": condition,
            "condition_icon": icon,
            "forecast_date": str(d),
            "is_forecast": is_forecast,
            "agricultural_insight": " ".join(insights) if insights else "Normal conditions for farming.",
            "source": "mock",
        }


class DBWeatherProvider(WeatherProvider):
    """Get weather from database (populated by seed data)."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def get_current(self, location: str) -> Dict[str, Any]:
        record = self.db.query(WeatherData).filter(
            WeatherData.location.ilike(f"%{location}%"),
            WeatherData.is_forecast == 0,
        ).order_by(WeatherData.forecast_date.desc()).first()
        
        if record:
            return {
                "location": record.location,
                "temperature_c": record.temperature_c,
                "humidity_percent": record.humidity_percent,
                "rainfall_mm": record.rainfall_mm,
                "wind_speed_kmh": record.wind_speed_kmh,
                "condition": record.condition,
                "condition_icon": record.condition_icon,
                "forecast_date": str(record.forecast_date),
                "is_forecast": False,
                "agricultural_insight": record.agricultural_insight,
                "source": record.source,
            }
        
        # Fallback to mock
        mock = MockWeatherProvider()
        return await mock.get_current(location)
    
    async def get_forecast(self, location: str, days: int = 7) -> List[Dict[str, Any]]:
        records = self.db.query(WeatherData).filter(
            WeatherData.location.ilike(f"%{location}%"),
            WeatherData.is_forecast == 1,
        ).order_by(WeatherData.forecast_date).limit(days).all()
        
        if records:
            return [{
                "location": r.location,
                "temperature_c": r.temperature_c,
                "humidity_percent": r.humidity_percent,
                "rainfall_mm": r.rainfall_mm,
                "wind_speed_kmh": r.wind_speed_kmh,
                "condition": r.condition,
                "condition_icon": r.condition_icon,
                "forecast_date": str(r.forecast_date),
                "is_forecast": True,
                "agricultural_insight": r.agricultural_insight,
                "source": r.source,
            } for r in records]
        
        mock = MockWeatherProvider()
        return await mock.get_forecast(location, days)


def get_weather_provider(db: Session = None) -> WeatherProvider:
    if settings.WEATHER_PROVIDER == "mock":
        if db:
            return DBWeatherProvider(db)
        return MockWeatherProvider()
    return MockWeatherProvider()
