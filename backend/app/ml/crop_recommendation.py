"""Crop recommendation system using multi-factor scoring."""
import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.market_data import PriceHistory, DemandHistory
from app.models.weather import WeatherData


# Crop growing conditions (temperature range, water needs, growing season months)
CROP_CONDITIONS = {
    "Tomato": {"temp_min": 20, "temp_max": 35, "water": "medium", "months": [2, 3, 4, 5, 6, 7, 8, 9]},
    "Potato": {"temp_min": 15, "temp_max": 25, "water": "medium", "months": [10, 11, 12, 1, 2]},
    "Onion": {"temp_min": 15, "temp_max": 30, "water": "low", "months": [10, 11, 12, 1, 2, 3]},
    "Cauliflower": {"temp_min": 15, "temp_max": 25, "water": "high", "months": [9, 10, 11, 12, 1, 2]},
    "Spinach": {"temp_min": 10, "temp_max": 25, "water": "medium", "months": [10, 11, 12, 1, 2, 3]},
    "Green Chilli": {"temp_min": 20, "temp_max": 35, "water": "medium", "months": [2, 3, 4, 5, 6, 7, 8]},
    "Brinjal": {"temp_min": 20, "temp_max": 35, "water": "medium", "months": [2, 3, 4, 5, 6, 7, 8]},
    "Carrot": {"temp_min": 15, "temp_max": 25, "water": "medium", "months": [9, 10, 11, 12, 1, 2]},
    "Capsicum": {"temp_min": 18, "temp_max": 30, "water": "medium", "months": [2, 3, 4, 5, 6, 7, 8, 9]},
    "Cabbage": {"temp_min": 15, "temp_max": 25, "water": "high", "months": [9, 10, 11, 12, 1, 2]},
    "Bitter Gourd": {"temp_min": 25, "temp_max": 40, "water": "medium", "months": [3, 4, 5, 6, 7, 8]},
    "Okra (Bhindi)": {"temp_min": 25, "temp_max": 40, "water": "medium", "months": [3, 4, 5, 6, 7, 8]},
    "Peas": {"temp_min": 10, "temp_max": 20, "water": "medium", "months": [10, 11, 12, 1, 2]},
    "Drumstick": {"temp_min": 25, "temp_max": 40, "water": "low", "months": [2, 3, 4, 5, 6, 7]},
    "Coriander": {"temp_min": 15, "temp_max": 30, "water": "medium", "months": [10, 11, 12, 1, 2, 3]},
    "Rice": {"temp_min": 20, "temp_max": 35, "water": "very_high", "months": [6, 7, 8, 9, 10]},
    "Wheat": {"temp_min": 10, "temp_max": 25, "water": "medium", "months": [10, 11, 12, 1, 2, 3]},
    "Mango": {"temp_min": 25, "temp_max": 40, "water": "low", "months": [2, 3, 4, 5, 6]},
    "Banana": {"temp_min": 20, "temp_max": 35, "water": "high", "months": list(range(1, 13))},
    "Watermelon": {"temp_min": 25, "temp_max": 40, "water": "medium", "months": [2, 3, 4, 5, 6]},
}


def recommend_crops(db: Session, location: Optional[str] = None, 
                    season: Optional[str] = None,
                    top_n: int = 5) -> List[Dict[str, Any]]:
    """Recommend crops based on multi-factor analysis."""
    
    current_month = datetime.now().month
    if not season:
        season_map = {1: "winter", 2: "winter", 3: "spring", 4: "spring", 5: "summer",
                      6: "summer", 7: "monsoon", 8: "monsoon", 9: "monsoon",
                      10: "autumn", 11: "autumn", 12: "winter"}
        season = season_map[current_month]
    
    # Get weather data for location
    weather = None
    if location:
        weather = db.query(WeatherData).filter(
            WeatherData.location.ilike(f"%{location}%"),
            WeatherData.is_forecast == 0,
        ).order_by(WeatherData.forecast_date.desc()).first()
    
    current_temp = weather.temperature_c if weather else 28  # Default
    current_rainfall = weather.rainfall_mm if weather else 5
    
    scores = []
    
    for crop_name, conditions in CROP_CONDITIONS.items():
        score = 0
        reasons = []
        assumptions = []
        
        # 1. Season/month suitability (0-30 points)
        if current_month in conditions["months"]:
            season_score = 30
            reasons.append(f"Current month is ideal for {crop_name} cultivation")
        else:
            # Check how far from ideal season
            min_distance = min(
                abs(current_month - m) if abs(current_month - m) <= 6 
                else 12 - abs(current_month - m)
                for m in conditions["months"]
            )
            season_score = max(0, 30 - min_distance * 8)
            if season_score > 0:
                reasons.append(f"Growing season is approaching for {crop_name}")
        score += season_score
        
        # 2. Temperature suitability (0-25 points)
        if conditions["temp_min"] <= current_temp <= conditions["temp_max"]:
            temp_score = 25
            reasons.append(f"Current temperature ({current_temp}°C) is suitable")
        else:
            diff = min(abs(current_temp - conditions["temp_min"]),
                      abs(current_temp - conditions["temp_max"]))
            temp_score = max(0, 25 - diff * 3)
        score += temp_score
        
        # 3. Demand analysis (0-20 points)
        demand_query = db.query(func.avg(DemandHistory.demand_quantity)).filter(
            DemandHistory.crop_name == crop_name
        )
        if location:
            demand_query = demand_query.filter(DemandHistory.location.ilike(f"%{location}%"))
        
        avg_demand = demand_query.scalar() or 0
        
        supply_query = db.query(func.avg(DemandHistory.supply_quantity)).filter(
            DemandHistory.crop_name == crop_name
        )
        avg_supply = supply_query.scalar() or 0
        
        if avg_demand > 0:
            demand_supply_ratio = avg_demand / max(avg_supply, 1)
            demand_score = min(20, demand_supply_ratio * 10)
            if demand_supply_ratio > 1.2:
                reasons.append(f"Demand exceeds supply by {(demand_supply_ratio-1)*100:.0f}%")
            assumptions.append(f"Based on synthetic demand data (avg: {avg_demand:.0f} units)")
        else:
            demand_score = 10  # Neutral
            assumptions.append("No demand data available")
        score += demand_score
        
        # 4. Price trend (0-15 points)
        recent_prices = db.query(PriceHistory).filter(
            PriceHistory.crop_name == crop_name
        ).order_by(PriceHistory.date.desc()).limit(30).all()
        
        if len(recent_prices) >= 14:
            recent_avg = np.mean([p.market_price for p in recent_prices[:7]])
            older_avg = np.mean([p.market_price for p in recent_prices[7:14]])
            price_trend = ((recent_avg - older_avg) / older_avg) * 100
            
            if price_trend > 5:
                price_score = 15
                expected_trend = "rising"
                reasons.append(f"Price trending up ({price_trend:+.1f}%)")
            elif price_trend < -5:
                price_score = 5
                expected_trend = "falling"
            else:
                price_score = 10
                expected_trend = "stable"
        else:
            price_score = 8
            expected_trend = "stable"
            assumptions.append("Limited price history")
        score += price_score
        
        # 5. Profitability (0-10 points)
        if recent_prices:
            current_price = recent_prices[0].market_price
            profit_score = min(10, current_price / 10)
        else:
            current_price = 30
            profit_score = 5
        score += profit_score
        
        confidence = min(0.95, score / 100)
        
        scores.append({
            "recommended_crop": crop_name,
            "reason": ". ".join(reasons) if reasons else f"{crop_name} is suitable for current conditions.",
            "expected_demand": round(avg_demand, 1),
            "expected_price_trend": expected_trend if 'expected_trend' in dir() else "stable",
            "confidence_score": round(confidence, 2),
            "assumptions": ". ".join(assumptions) if assumptions else "Based on synthetic data.",
            "season": season,
            "location": location,
            "score": round(score, 2),
            "current_price": round(current_price, 2) if 'current_price' in dir() else None,
        })
    
    # Sort by score
    scores.sort(key=lambda x: x["score"], reverse=True)
    
    return scores[:top_n]
