"""Synthetic data generation for KisanSetu prototype."""
import random
import math
from datetime import datetime, timedelta, date
from typing import List
from sqlalchemy.orm import Session

from app.models.user import User, UserRole, FarmerProfile, ConsumerProfile
from app.models.product import Product, ProductImage, Category, ProductStatus, ProductUnit
from app.models.inventory import Inventory, InventoryTransaction, TransactionType
from app.models.order import Order, OrderItem, OrderStatus, Payment, PaymentMethod, PaymentStatus
from app.models.market_data import PriceHistory, DemandHistory
from app.models.weather import WeatherData
from app.services.auth_service import hash_password

random.seed(42)

# Realistic Indian vegetable/crop data
CROPS = [
    {"name": "Tomato", "category": "Vegetables", "base_price": 40, "unit": "kg", "seasonality": [0.8, 0.7, 0.9, 1.2, 1.4, 1.0, 0.6, 0.5, 0.7, 1.0, 1.2, 1.1]},
    {"name": "Potato", "category": "Vegetables", "base_price": 25, "unit": "kg", "seasonality": [1.0, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2, 1.1, 1.0, 0.9, 1.0]},
    {"name": "Onion", "category": "Vegetables", "base_price": 35, "unit": "kg", "seasonality": [1.2, 1.3, 1.0, 0.8, 0.7, 0.9, 1.0, 1.1, 1.3, 1.5, 1.4, 1.2]},
    {"name": "Cauliflower", "category": "Vegetables", "base_price": 30, "unit": "piece", "seasonality": [1.3, 1.2, 0.9, 0.6, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.4, 1.3]},
    {"name": "Spinach", "category": "Leafy Greens", "base_price": 25, "unit": "bunch", "seasonality": [1.3, 1.2, 1.0, 0.7, 0.5, 0.4, 0.5, 0.7, 0.9, 1.1, 1.3, 1.4]},
    {"name": "Green Chilli", "category": "Vegetables", "base_price": 60, "unit": "kg", "seasonality": [0.9, 0.8, 1.0, 1.2, 1.3, 1.1, 0.8, 0.7, 0.9, 1.0, 1.1, 1.0]},
    {"name": "Brinjal", "category": "Vegetables", "base_price": 35, "unit": "kg", "seasonality": [0.9, 0.8, 1.0, 1.1, 1.2, 1.0, 0.8, 0.7, 0.9, 1.0, 1.1, 1.0]},
    {"name": "Carrot", "category": "Root Vegetables", "base_price": 40, "unit": "kg", "seasonality": [1.2, 1.1, 0.9, 0.7, 0.5, 0.4, 0.5, 0.7, 0.9, 1.1, 1.3, 1.3]},
    {"name": "Capsicum", "category": "Vegetables", "base_price": 80, "unit": "kg", "seasonality": [1.0, 0.9, 1.0, 1.1, 1.2, 1.0, 0.8, 0.8, 0.9, 1.0, 1.1, 1.0]},
    {"name": "Cabbage", "category": "Vegetables", "base_price": 20, "unit": "kg", "seasonality": [1.2, 1.1, 0.9, 0.7, 0.6, 0.5, 0.6, 0.8, 1.0, 1.2, 1.3, 1.3]},
    {"name": "Bitter Gourd", "category": "Vegetables", "base_price": 45, "unit": "kg", "seasonality": [0.7, 0.8, 1.0, 1.2, 1.4, 1.3, 1.0, 0.8, 0.9, 1.0, 0.8, 0.7]},
    {"name": "Okra (Bhindi)", "category": "Vegetables", "base_price": 50, "unit": "kg", "seasonality": [0.6, 0.7, 0.9, 1.1, 1.3, 1.4, 1.2, 1.0, 0.9, 0.8, 0.7, 0.6]},
    {"name": "Peas", "category": "Vegetables", "base_price": 60, "unit": "kg", "seasonality": [1.4, 1.3, 1.0, 0.6, 0.3, 0.2, 0.3, 0.5, 0.7, 1.0, 1.3, 1.4]},
    {"name": "Drumstick", "category": "Vegetables", "base_price": 55, "unit": "kg", "seasonality": [0.8, 0.9, 1.1, 1.3, 1.2, 1.0, 0.8, 0.7, 0.8, 1.0, 0.9, 0.8]},
    {"name": "Coriander", "category": "Herbs", "base_price": 30, "unit": "bunch", "seasonality": [1.2, 1.1, 1.0, 0.8, 0.6, 0.5, 0.6, 0.8, 1.0, 1.1, 1.2, 1.3]},
    {"name": "Rice", "category": "Grains", "base_price": 45, "unit": "kg", "seasonality": [1.0, 1.0, 1.0, 1.0, 0.9, 0.9, 0.8, 0.8, 0.9, 1.1, 1.1, 1.0]},
    {"name": "Wheat", "category": "Grains", "base_price": 30, "unit": "kg", "seasonality": [0.9, 0.9, 1.0, 1.1, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9, 0.9, 0.9]},
    {"name": "Mango", "category": "Fruits", "base_price": 100, "unit": "kg", "seasonality": [0.3, 0.4, 0.7, 1.2, 1.5, 1.5, 1.3, 0.8, 0.4, 0.2, 0.2, 0.3]},
    {"name": "Banana", "category": "Fruits", "base_price": 40, "unit": "dozen", "seasonality": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]},
    {"name": "Watermelon", "category": "Fruits", "base_price": 15, "unit": "kg", "seasonality": [0.3, 0.5, 0.8, 1.2, 1.5, 1.4, 1.0, 0.6, 0.4, 0.3, 0.2, 0.2]},
]

LOCATIONS = [
    {"city": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567},
    {"city": "Nashik", "state": "Maharashtra", "lat": 19.9975, "lng": 73.7898},
    {"city": "Nagpur", "state": "Maharashtra", "lat": 21.1458, "lng": 79.0882},
    {"city": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lng": 75.7873},
    {"city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lng": 80.9462},
    {"city": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lng": 77.5946},
    {"city": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lng": 78.4867},
    {"city": "Indore", "state": "Madhya Pradesh", "lat": 22.7196, "lng": 75.8577},
]

FARMER_NAMES = [
    "Ramesh Patel", "Suresh Kumar", "Lakshmi Devi", "Mohan Singh",
    "Priya Sharma", "Rajesh Yadav", "Sunita Bai", "Ganesh Reddy",
]

CONSUMER_NAMES = [
    "Amit Shah", "Neha Gupta", "Rahul Verma", "Sneha Joshi",
    "Vikram Mehta", "Anjali Nair", "Deepak Tiwari", "Kavita Rao",
]

SEASONS = {1: "winter", 2: "winter", 3: "spring", 4: "spring", 5: "summer",
            6: "summer", 7: "monsoon", 8: "monsoon", 9: "monsoon",
            10: "autumn", 11: "autumn", 12: "winter"}

FESTIVALS = {
    (1, 14): "Makar Sankranti", (3, 25): "Holi", (8, 15): "Independence Day",
    (10, 2): "Gandhi Jayanti", (10, 24): "Dussehra", (11, 12): "Diwali",
}


def _is_festival_period(d: date) -> bool:
    for (m, day), _ in FESTIVALS.items():
        fest_date = date(d.year, m, day)
        if abs((d - fest_date).days) <= 3:
            return True
    return False


def generate_price_history(db: Session):
    """Generate 2 years of realistic price history with seasonality, trends, and noise."""
    start_date = datetime.now().date() - timedelta(days=730)
    
    for crop in CROPS:
        base = crop["base_price"]
        trend = random.uniform(-0.0005, 0.001)  # Slight price trend
        
        for day_offset in range(730):
            d = start_date + timedelta(days=day_offset)
            month_idx = d.month - 1
            season_factor = crop["seasonality"][month_idx]
            
            # Festival demand spike
            festival_factor = 1.15 if _is_festival_period(d) else 1.0
            
            # Weekly pattern
            weekly = 1.0 + 0.03 * math.sin(2 * math.pi * d.weekday() / 7)
            
            # Long-term trend
            trend_factor = 1.0 + trend * day_offset
            
            # Random noise
            noise = random.gauss(1.0, 0.05)
            
            price = base * season_factor * festival_factor * weekly * trend_factor * noise
            price = max(5, round(price, 2))
            
            for loc in random.sample(LOCATIONS, min(3, len(LOCATIONS))):
                loc_factor = random.uniform(0.9, 1.1)
                ph = PriceHistory(
                    crop_name=crop["name"],
                    location=f"{loc['city']}, {loc['state']}",
                    market_price=round(price * loc_factor, 2),
                    wholesale_price=round(price * loc_factor * 0.8, 2),
                    retail_price=round(price * loc_factor * 1.3, 2),
                    unit=crop["unit"],
                    source="synthetic",
                    date=d,
                )
                db.add(ph)
    
    db.commit()


def generate_demand_history(db: Session):
    """Generate demand history correlated with price, season, and location."""
    start_date = datetime.now().date() - timedelta(days=365)
    
    for crop in CROPS:
        base_demand = random.uniform(500, 2000)
        
        for day_offset in range(0, 365, 7):  # Weekly data
            d = start_date + timedelta(days=day_offset)
            month_idx = d.month - 1
            season_factor = crop["seasonality"][month_idx]
            
            festival = _is_festival_period(d)
            festival_factor = 1.3 if festival else 1.0
            
            demand = base_demand * season_factor * festival_factor * random.gauss(1.0, 0.1)
            supply = demand * random.uniform(0.7, 1.3)
            
            for loc in random.sample(LOCATIONS, 2):
                dh = DemandHistory(
                    crop_name=crop["name"],
                    location=f"{loc['city']}, {loc['state']}",
                    demand_quantity=round(max(10, demand * random.uniform(0.8, 1.2)), 1),
                    supply_quantity=round(max(10, supply * random.uniform(0.8, 1.2)), 1),
                    season=SEASONS[d.month],
                    festival_flag=festival,
                    date=d,
                    source="synthetic",
                )
                db.add(dh)
    
    db.commit()


def generate_weather_data(db: Session):
    """Generate realistic weather data for farming locations."""
    today = datetime.now().date()
    
    for loc in LOCATIONS:
        # Current + 7 day forecast
        for day_offset in range(-7, 8):
            d = today + timedelta(days=day_offset)
            month = d.month
            
            # Temperature based on Indian climate zones
            base_temp = {
                1: 15, 2: 18, 3: 25, 4: 32, 5: 38, 6: 35,
                7: 30, 8: 28, 9: 28, 10: 28, 11: 22, 12: 17,
            }
            
            # South India is warmer
            lat_adjust = max(0, (20 - loc["lat"]) * 0.5)
            temp = base_temp[month] + lat_adjust + random.gauss(0, 2)
            
            # Rainfall
            monsoon_rain = {
                1: 5, 2: 3, 3: 5, 4: 10, 5: 15, 6: 80,
                7: 150, 8: 130, 9: 100, 10: 40, 11: 15, 12: 8,
            }
            rainfall = max(0, monsoon_rain[month] * random.uniform(0.3, 1.5) / 30)
            
            conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Heavy Rain", "Thunderstorm", "Clear"]
            if rainfall > 5:
                condition = random.choice(["Heavy Rain", "Thunderstorm", "Light Rain"])
            elif rainfall > 1:
                condition = "Light Rain"
            elif temp > 35:
                condition = random.choice(["Sunny", "Clear"])
            else:
                condition = random.choice(["Sunny", "Partly Cloudy", "Clear", "Cloudy"])

            icons = {
                "Sunny": "☀️", "Clear": "🌙", "Partly Cloudy": "⛅",
                "Cloudy": "☁️", "Light Rain": "🌦️", "Heavy Rain": "🌧️",
                "Thunderstorm": "⛈️",
            }
            
            # Agricultural insight
            insights = []
            if temp > 35:
                insights.append("High temperature. Ensure adequate irrigation for crops.")
            if temp < 10:
                insights.append("Low temperature. Protect frost-sensitive crops.")
            if rainfall > 5:
                insights.append("Heavy rainfall expected. Delay spraying and harvesting.")
            if 25 <= temp <= 30 and rainfall < 2:
                insights.append("Ideal growing conditions for most vegetables.")
            
            wd = WeatherData(
                location=f"{loc['city']}, {loc['state']}",
                latitude=loc["lat"],
                longitude=loc["lng"],
                temperature_c=round(temp, 1),
                humidity_percent=round(random.uniform(40, 90), 1),
                rainfall_mm=round(rainfall, 1),
                wind_speed_kmh=round(random.uniform(5, 25), 1),
                condition=condition,
                condition_icon=icons.get(condition, "☀️"),
                forecast_date=d,
                is_forecast=1 if day_offset > 0 else 0,
                source="mock",
                agricultural_insight=". ".join(insights) if insights else "Normal conditions for farming.",
            )
            db.add(wd)
    
    db.commit()


def seed_database(db: Session):
    """Main seed function - creates all demo data."""
    
    # Check if already seeded
    if db.query(User).first():
        return {"message": "Database already seeded"}

    # 1. Create categories
    categories_data = [
        {"name": "Vegetables", "slug": "vegetables", "icon": "🥬"},
        {"name": "Leafy Greens", "slug": "leafy-greens", "icon": "🥗"},
        {"name": "Root Vegetables", "slug": "root-vegetables", "icon": "🥕"},
        {"name": "Fruits", "slug": "fruits", "icon": "🍎"},
        {"name": "Grains", "slug": "grains", "icon": "🌾"},
        {"name": "Herbs", "slug": "herbs", "icon": "🌿"},
    ]
    categories = {}
    for cat_data in categories_data:
        cat = Category(**cat_data)
        db.add(cat)
        db.flush()
        categories[cat_data["name"]] = cat.id

    # 2. Create demo farmers
    farmers = []
    for i, name in enumerate(FARMER_NAMES):
        loc = LOCATIONS[i % len(LOCATIONS)]
        user = User(
            email=f"farmer{i+1}@kisansetu.com",
            hashed_password=hash_password("farmer123"),
            full_name=name,
            phone=f"98765{str(i).zfill(5)}",
            role=UserRole.FARMER,
        )
        db.add(user)
        db.flush()

        profile = FarmerProfile(
            user_id=user.id,
            farm_name=f"{name.split()[0]}'s Farm",
            farm_description=f"Fresh organic produce from {loc['city']}. Growing vegetables for {random.randint(3, 20)} years.",
            address=f"Village {random.choice(['Kothrud', 'Hadapsar', 'Wagholi', 'Phursungi', 'Manjari'])}, Near {loc['city']}",
            city=loc["city"],
            state=loc["state"],
            pincode=f"{random.randint(400000, 500000)}",
            latitude=loc["lat"] + random.uniform(-0.05, 0.05),
            longitude=loc["lng"] + random.uniform(-0.05, 0.05),
            farm_size_acres=random.uniform(2, 25),
            experience_years=random.randint(3, 20),
            organic_certified=random.random() > 0.5,
            rating=round(random.uniform(3.5, 4.9), 1),
            total_reviews=random.randint(5, 100),
            production_cost_per_kg=round(random.uniform(8, 20), 2),
        )
        db.add(profile)
        db.flush()
        farmers.append(profile)

    # 3. Create demo consumers
    consumers = []
    for i, name in enumerate(CONSUMER_NAMES):
        loc = LOCATIONS[i % len(LOCATIONS)]
        user = User(
            email=f"consumer{i+1}@kisansetu.com",
            hashed_password=hash_password("consumer123"),
            full_name=name,
            phone=f"87654{str(i).zfill(5)}",
            role=UserRole.CONSUMER,
        )
        db.add(user)
        db.flush()

        profile = ConsumerProfile(
            user_id=user.id,
            address=f"{random.randint(1, 500)}, {random.choice(['MG Road', 'Station Road', 'Gandhi Nagar', 'Shivaji Nagar'])}, {loc['city']}",
            city=loc["city"],
            state=loc["state"],
            pincode=f"{random.randint(400000, 500000)}",
            latitude=loc["lat"] + random.uniform(-0.1, 0.1),
            longitude=loc["lng"] + random.uniform(-0.1, 0.1),
        )
        db.add(profile)
        db.flush()
        consumers.append(profile)

    # 4. Create products for each farmer
    products = []
    for farmer in farmers:
        # Each farmer sells 3-6 crops
        farmer_crops = random.sample(CROPS, random.randint(3, 6))
        for crop in farmer_crops:
            qty = round(random.uniform(20, 200), 1)
            price_variation = random.uniform(0.85, 1.2)
            price = round(crop["base_price"] * price_variation, 2)
            
            product = Product(
                farmer_id=farmer.id,
                category_id=categories.get(crop["category"]),
                name=crop["name"],
                description=f"Fresh {crop['name'].lower()} from {farmer.farm_name}. Harvested with care, directly from farm to your table.",
                price=price,
                unit=crop["unit"],
                available_quantity=qty,
                min_order_quantity=0.5 if crop["unit"] == "kg" else 1,
                harvest_date=datetime.now().date() - timedelta(days=random.randint(0, 5)),
                availability_date=datetime.now().date(),
                location=f"{farmer.city}, {farmer.state}",
                quality_grade=random.choice(["Premium", "Standard", "A", "B"]),
                is_organic=farmer.organic_certified,
                status=ProductStatus.ACTIVE,
            )
            db.add(product)
            db.flush()
            
            # Create inventory
            inv = Inventory(
                product_id=product.id,
                current_stock=qty,
                total_added=qty,
                low_stock_threshold=10,
            )
            db.add(inv)
            
            # Add initial stock transaction
            db.flush()
            tx = InventoryTransaction(
                inventory_id=inv.id,
                transaction_type=TransactionType.STOCK_ADDED,
                quantity=qty,
                previous_stock=0,
                new_stock=qty,
                notes="Initial stock",
            )
            db.add(tx)
            
            products.append(product)

    db.commit()

    # 5. Create some demo orders
    import uuid as uuid_mod
    for _ in range(15):
        consumer = random.choice(consumers)
        order_products = random.sample(products, min(random.randint(1, 3), len(products)))
        
        subtotal = 0
        items = []
        for p in order_products:
            qty = round(random.uniform(1, 10), 1)
            item_total = round(p.price * qty, 2)
            subtotal += item_total
            items.append({"product": p, "quantity": qty, "total": item_total})
        
        delivery_fee = 30.0 if subtotal < 500 else 0
        total = subtotal + delivery_fee
        
        status = random.choice([OrderStatus.DELIVERED, OrderStatus.CONFIRMED, OrderStatus.PENDING, OrderStatus.OUT_FOR_DELIVERY])
        
        order = Order(
            order_number=f"KS-{uuid_mod.uuid4().hex[:8].upper()}",
            consumer_id=consumer.id,
            status=status,
            subtotal=round(subtotal, 2),
            delivery_fee=delivery_fee,
            total=round(total, 2),
            delivery_address=consumer.address,
            delivery_latitude=consumer.latitude,
            delivery_longitude=consumer.longitude,
            estimated_delivery_time=datetime.utcnow() + timedelta(hours=random.randint(1, 4)),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
        )
        if status == OrderStatus.DELIVERED:
            order.actual_delivery_time = order.created_at + timedelta(hours=random.randint(1, 3))
        
        db.add(order)
        db.flush()
        
        for item_data in items:
            oi = OrderItem(
                order_id=order.id,
                product_id=item_data["product"].id,
                farmer_id=item_data["product"].farmer_id,
                product_name=item_data["product"].name,
                quantity=item_data["quantity"],
                unit_price=item_data["product"].price,
                total_price=item_data["total"],
                unit=item_data["product"].unit.value if hasattr(item_data["product"].unit, 'value') else item_data["product"].unit,
            )
            db.add(oi)
        
        payment = Payment(
            order_id=order.id,
            payment_method=random.choice(list(PaymentMethod)),
            status=PaymentStatus.COMPLETED if status == OrderStatus.DELIVERED else PaymentStatus.PENDING,
            amount=round(total, 2),
            transaction_id=f"MOCK-{uuid_mod.uuid4().hex[:12].upper()}" if status == OrderStatus.DELIVERED else None,
        )
        db.add(payment)

    db.commit()

    # 6. Generate historical data
    generate_price_history(db)
    generate_demand_history(db)
    generate_weather_data(db)

    return {
        "message": "Database seeded successfully",
        "farmers": len(farmers),
        "consumers": len(consumers),
        "products": len(products),
        "categories": len(categories),
    }
