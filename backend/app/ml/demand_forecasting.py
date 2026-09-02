"""Demand forecasting model using structured ML."""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

from app.models.market_data import DemandHistory


class DemandForecastModel:
    """ML-based demand forecasting."""
    
    def __init__(self):
        self.model = None
        self.crop_encoder = LabelEncoder()
        self.location_encoder = LabelEncoder()
        self.is_trained = False
    
    def train(self, db: Session, crop_name: Optional[str] = None) -> Dict[str, Any]:
        query = db.query(DemandHistory)
        if crop_name:
            query = query.filter(DemandHistory.crop_name == crop_name)
        
        records = query.order_by(DemandHistory.date).all()
        if len(records) < 10:
            return {"trained": False, "reason": "Insufficient data"}
        
        df = pd.DataFrame([{
            "date": r.date,
            "crop_name": r.crop_name,
            "location": r.location or "unknown",
            "demand_quantity": r.demand_quantity,
            "supply_quantity": r.supply_quantity or 0,
            "festival_flag": 1 if r.festival_flag else 0,
        } for r in records])
        
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.month
        df['week'] = df['date'].dt.isocalendar().week.astype(int)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        df['trend'] = (df['date'] - df['date'].min()).dt.days
        
        df['crop_encoded'] = self.crop_encoder.fit_transform(df['crop_name'])
        df['location_encoded'] = self.location_encoder.fit_transform(df['location'])
        
        features = ['month_sin', 'month_cos', 'supply_quantity', 'festival_flag',
                     'trend', 'crop_encoded', 'location_encoded']
        
        X = df[features].values
        y = df['demand_quantity'].values
        
        self.model = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
        self.model.fit(X, y)
        self.is_trained = True
        
        return {"trained": True, "samples": len(records)}
    
    def forecast(self, db: Session, crop_name: str, weeks_ahead: int = 4,
                 location: Optional[str] = None) -> List[Dict[str, Any]]:
        if not self.is_trained:
            result = self.train(db, crop_name)
            if not result.get("trained"):
                return self._fallback_forecast(db, crop_name, weeks_ahead)
        
        try:
            crop_enc = self.crop_encoder.transform([crop_name])[0]
        except ValueError:
            return self._fallback_forecast(db, crop_name, weeks_ahead)
        
        try:
            loc_enc = self.location_encoder.transform([location or "unknown"])[0]
        except ValueError:
            loc_enc = 0
        
        today = datetime.now().date()
        recent = db.query(DemandHistory).filter(
            DemandHistory.crop_name == crop_name
        ).order_by(DemandHistory.date.desc()).limit(4).all()
        
        avg_supply = np.mean([r.supply_quantity or 0 for r in recent]) if recent else 500
        trend_base = 365
        
        forecasts = []
        for w in range(1, weeks_ahead + 1):
            future_date = today + timedelta(weeks=w)
            month_sin = np.sin(2 * np.pi * future_date.month / 12)
            month_cos = np.cos(2 * np.pi * future_date.month / 12)
            
            features = np.array([[
                month_sin, month_cos, avg_supply, 0,
                trend_base + w * 7, crop_enc, loc_enc
            ]])
            
            pred = float(self.model.predict(features)[0])
            pred = max(10, pred)
            confidence = max(0.4, 0.85 - (w * 0.08))
            
            forecasts.append({
                "date": str(future_date),
                "demand": round(pred, 1),
                "confidence": round(confidence, 2),
            })
        
        return forecasts
    
    def _fallback_forecast(self, db: Session, crop_name: str,
                           weeks_ahead: int) -> List[Dict[str, Any]]:
        recent = db.query(DemandHistory).filter(
            DemandHistory.crop_name == crop_name
        ).order_by(DemandHistory.date.desc()).limit(12).all()
        
        avg_demand = np.mean([r.demand_quantity for r in recent]) if recent else 500
        today = datetime.now().date()
        
        return [{
            "date": str(today + timedelta(weeks=w)),
            "demand": round(avg_demand * (1 + np.random.normal(0, 0.05)), 1),
            "confidence": round(max(0.3, 0.6 - w * 0.05), 2),
        } for w in range(1, weeks_ahead + 1)]


_demand_model = DemandForecastModel()


def forecast_demand(db: Session, crop_name: str, weeks_ahead: int = 4,
                    location: Optional[str] = None) -> Dict[str, Any]:
    forecasts = _demand_model.forecast(db, crop_name, weeks_ahead, location)
    
    if not forecasts:
        return {
            "crop_name": crop_name,
            "forecasted_demand": [],
            "trend": "unknown",
            "explanation": f"No demand data available for {crop_name}.",
            "model_used": "none",
            "data_source": "synthetic",
        }
    
    demands = [f["demand"] for f in forecasts]
    if len(demands) >= 2:
        change = ((demands[-1] - demands[0]) / demands[0]) * 100
        trend = "rising" if change > 5 else "falling" if change < -5 else "stable"
    else:
        trend = "stable"
        change = 0
    
    model_name = "RandomForest" if _demand_model.is_trained else "MovingAverage"
    
    return {
        "crop_name": crop_name,
        "forecasted_demand": forecasts,
        "trend": trend,
        "explanation": (
            f"Demand forecast for {crop_name} over {weeks_ahead} weeks shows {trend} trend "
            f"({change:+.1f}%). Predictions use {model_name} model trained on synthetic historical data."
        ),
        "model_used": model_name,
        "data_source": "synthetic",
    }
