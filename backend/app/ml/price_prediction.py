"""Price prediction model using structured ML (not LLM).

Uses historical price data with features like seasonality, trend, and 
location to predict future prices via a RandomForest regressor.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

from app.models.market_data import PriceHistory


class PricePredictionModel:
    """ML-based price prediction using historical market data."""
    
    def __init__(self):
        self.model = None
        self.location_encoder = LabelEncoder()
        self.is_trained = False
        self.mae = None
    
    def _prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Engineer features from raw price data."""
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.month
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_year'] = df['date'].dt.dayofyear
        df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)
        
        # Cyclical encoding for seasonality
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        df['dow_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['dow_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        # Rolling averages (if enough data)
        if len(df) > 7:
            df['price_ma7'] = df['market_price'].rolling(7, min_periods=1).mean()
            df['price_ma30'] = df['market_price'].rolling(30, min_periods=1).mean()
            df['price_std7'] = df['market_price'].rolling(7, min_periods=1).std().fillna(0)
        else:
            df['price_ma7'] = df['market_price']
            df['price_ma30'] = df['market_price']
            df['price_std7'] = 0
        
        # Trend (days since start)
        df['trend'] = (df['date'] - df['date'].min()).dt.days
        
        return df
    
    def train(self, db: Session, crop_name: str, location: Optional[str] = None) -> Dict[str, Any]:
        """Train price prediction model on historical data."""
        crop_name = crop_name.title()
        query = db.query(PriceHistory).filter(PriceHistory.crop_name == crop_name)
        if location:
            query = query.filter(PriceHistory.location.ilike(f"%{location}%"))
        
        records = query.order_by(PriceHistory.date).all()
        
        if len(records) < 30:
            return {"trained": False, "reason": "Insufficient data (need at least 30 records)"}
        
        df = pd.DataFrame([{
            "date": r.date,
            "market_price": r.market_price,
            "location": r.location or "unknown",
        } for r in records])
        
        df = self._prepare_features(df)
        
        # Encode location
        df['location_encoded'] = self.location_encoder.fit_transform(df['location'])
        
        feature_cols = [
            'month_sin', 'month_cos', 'dow_sin', 'dow_cos',
            'price_ma7', 'price_ma30', 'price_std7', 'trend',
            'location_encoded',
        ]
        
        X = df[feature_cols].values
        y = df['market_price'].values
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
        
        self.model = GradientBoostingRegressor(
            n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42
        )
        self.model.fit(X_train, y_train)
        
        y_pred = self.model.predict(X_test)
        self.mae = mean_absolute_error(y_test, y_pred)
        self.is_trained = True
        
        return {
            "trained": True,
            "samples": len(records),
            "mae": round(self.mae, 2),
            "test_size": len(X_test),
        }
    
    def predict(self, db: Session, crop_name: str, days_ahead: int = 7,
                location: Optional[str] = None) -> List[Dict[str, Any]]:
        """Predict prices for next N days."""
        crop_name = crop_name.title()
        if not self.is_trained:
            train_result = self.train(db, crop_name, location)
            if not train_result.get("trained"):
                # Fallback: return simple moving average forecast
                return self._fallback_predict(db, crop_name, days_ahead, location)
        
        # Get recent data for feature calculation
        recent = db.query(PriceHistory).filter(
            PriceHistory.crop_name == crop_name
        ).order_by(PriceHistory.date.desc()).limit(30).all()
        
        if not recent:
            return []
        
        recent_prices = [r.market_price for r in reversed(recent)]
        last_date = recent[0].date
        last_location = recent[0].location or "unknown"
        
        try:
            loc_encoded = self.location_encoder.transform([last_location])[0]
        except (ValueError, AttributeError):
            loc_encoded = 0
        
        predictions = []
        trend_base = (datetime.now().date() - (last_date - timedelta(days=len(recent_prices)))).days
        
        for i in range(1, days_ahead + 1):
            future_date = last_date + timedelta(days=i)
            
            month_sin = np.sin(2 * np.pi * future_date.month / 12)
            month_cos = np.cos(2 * np.pi * future_date.month / 12)
            dow_sin = np.sin(2 * np.pi * future_date.weekday() / 7)
            dow_cos = np.cos(2 * np.pi * future_date.weekday() / 7)
            
            price_ma7 = np.mean(recent_prices[-7:])
            price_ma30 = np.mean(recent_prices[-30:]) if len(recent_prices) >= 30 else np.mean(recent_prices)
            price_std7 = np.std(recent_prices[-7:]) if len(recent_prices) >= 7 else 0
            trend = trend_base + i
            
            features = np.array([[
                month_sin, month_cos, dow_sin, dow_cos,
                price_ma7, price_ma30, price_std7, trend, loc_encoded
            ]])
            
            pred_price = float(self.model.predict(features)[0])
            pred_price = max(1, pred_price)
            
            confidence = max(0.5, 1.0 - (i * 0.05))  # Confidence decreases with time
            
            predictions.append({
                "date": str(future_date),
                "predicted_price": round(pred_price, 2),
                "confidence": round(confidence, 2),
                "lower_bound": round(pred_price * 0.9, 2),
                "upper_bound": round(pred_price * 1.1, 2),
            })
            
            recent_prices.append(pred_price)
        
        return predictions
    
    def _fallback_predict(self, db: Session, crop_name: str, days_ahead: int,
                          location: Optional[str] = None) -> List[Dict[str, Any]]:
        """Simple moving average fallback when ML model can't be trained."""
        crop_name = crop_name.title()
        recent = db.query(PriceHistory).filter(
            PriceHistory.crop_name == crop_name
        ).order_by(PriceHistory.date.desc()).limit(30).all()
        
        if not recent:
            return []
        
        avg_price = np.mean([r.market_price for r in recent])
        std_price = np.std([r.market_price for r in recent])
        last_date = recent[0].date
        
        return [{
            "date": str(last_date + timedelta(days=i)),
            "predicted_price": round(avg_price, 2),
            "confidence": round(max(0.4, 0.7 - (i * 0.03)), 2),
            "lower_bound": round(avg_price - std_price, 2),
            "upper_bound": round(avg_price + std_price, 2),
        } for i in range(1, days_ahead + 1)]


def get_price_intelligence(db: Session, crop_name: str, farmer_price: Optional[float] = None,
                           location: Optional[str] = None) -> Dict[str, Any]:
    """Get market price intelligence for a crop."""
    crop_name = crop_name.title()
    # Get recent market prices
    query = db.query(PriceHistory).filter(PriceHistory.crop_name == crop_name)
    if location:
        query = query.filter(PriceHistory.location.ilike(f"%{location}%"))
    
    recent_prices = query.order_by(PriceHistory.date.desc()).limit(30).all()
    
    if not recent_prices:
        return {
            "crop_name": crop_name,
            "current_market_price": 0,
            "farmer_selling_price": farmer_price,
            "price_comparison": "no_data",
            "suggested_price_min": 0,
            "suggested_price_max": 0,
            "explanation": f"No market price data available for {crop_name}.",
            "confidence": 0,
            "data_source": "synthetic",
        }
    
    prices = [p.market_price for p in recent_prices]
    current_market = round(np.mean(prices[:7]), 2)  # Last 7 days average
    price_std = round(np.std(prices[:7]), 2)
    
    # Price trend
    if len(prices) >= 14:
        recent_avg = np.mean(prices[:7])
        older_avg = np.mean(prices[7:14])
        trend_pct = ((recent_avg - older_avg) / older_avg) * 100
    else:
        trend_pct = 0
    
    # Suggested price range
    suggested_min = round(current_market * 0.85, 2)
    suggested_max = round(current_market * 1.15, 2)
    
    # Comparison with farmer's price
    comparison = "no_data"
    if farmer_price:
        if farmer_price > current_market * 1.1:
            comparison = "above_market"
        elif farmer_price < current_market * 0.9:
            comparison = "below_market"
        else:
            comparison = "at_market"
    
    # Explanation
    trend_desc = "rising" if trend_pct > 3 else "falling" if trend_pct < -3 else "stable"
    explanation = (
        f"The current average market price for {crop_name} is ₹{current_market}/kg "
        f"based on recent data. Prices are {trend_desc} ({trend_pct:+.1f}% week-over-week). "
    )
    if farmer_price:
        diff = farmer_price - current_market
        explanation += f"Your selling price (₹{farmer_price}) is ₹{abs(diff):.2f} "
        explanation += f"{'above' if diff > 0 else 'below'} the market average. "
    explanation += f"Suggested selling range: ₹{suggested_min} - ₹{suggested_max}."
    
    return {
        "crop_name": crop_name,
        "current_market_price": current_market,
        "farmer_selling_price": farmer_price,
        "price_comparison": comparison,
        "suggested_price_min": suggested_min,
        "suggested_price_max": suggested_max,
        "explanation": explanation,
        "confidence": round(min(0.9, 0.5 + len(recent_prices) * 0.01), 2),
        "data_source": "synthetic",
        "trend": trend_desc,
        "trend_percent": round(trend_pct, 2),
        "price_std": price_std,
    }


# Singleton model instance
_price_model = PricePredictionModel()


def predict_prices(db: Session, crop_name: str, days_ahead: int = 7,
                   location: Optional[str] = None) -> Dict[str, Any]:
    """Get price predictions."""
    crop_name = crop_name.title()
    predictions = _price_model.predict(db, crop_name, days_ahead, location)
    
    if not predictions:
        return {
            "crop_name": crop_name,
            "predicted_prices": [],
            "trend": "unknown",
            "explanation": f"Insufficient data to predict prices for {crop_name}.",
            "model_used": "none",
            "data_source": "synthetic",
        }
    
    # Determine trend
    if len(predictions) >= 2:
        first_price = predictions[0]["predicted_price"]
        last_price = predictions[-1]["predicted_price"]
        change = ((last_price - first_price) / first_price) * 100
        trend = "rising" if change > 3 else "falling" if change < -3 else "stable"
    else:
        trend = "stable"
        change = 0
    
    model_name = "GradientBoosting" if _price_model.is_trained else "MovingAverage"
    
    return {
        "crop_name": crop_name,
        "predicted_prices": predictions,
        "trend": trend,
        "explanation": (
            f"Price forecast for {crop_name} over the next {days_ahead} days "
            f"shows a {trend} trend ({change:+.1f}%). "
            f"Model: {model_name}. MAE: ₹{_price_model.mae:.2f}" if _price_model.mae else
            f"Price forecast for {crop_name} using {model_name} model. "
            f"Data source: synthetic historical prices."
        ),
        "model_used": model_name,
        "data_source": "synthetic",
    }
