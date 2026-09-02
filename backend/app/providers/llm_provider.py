"""LLM Provider interface with mock implementation for AI assistant."""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from app.config import get_settings

settings = get_settings()


class LLMProvider(ABC):
    """Abstract LLM provider interface."""
    
    @abstractmethod
    async def generate(self, prompt: str, system_prompt: str = "", 
                       context: Optional[Dict] = None) -> str:
        pass


class MockLLMProvider(LLMProvider):
    """Mock LLM provider for development - uses rule-based responses."""
    
    SYSTEM_KNOWLEDGE = {
        "kisansetu": "KisanSetu is a direct farmer-to-consumer agricultural marketplace that eliminates intermediaries.",
        "add_product": "To add a product: Go to your Dashboard → Click 'Add Product' → Fill in name, category, price, quantity, and upload photos → Click Save.",
        "inventory": "Your inventory is tracked automatically. When orders are placed, stock is reserved and deducted. View your current stock on the Dashboard or Inventory page.",
        "orders": "Orders go through states: Pending → Confirmed → Preparing → Ready for Pickup → Out for Delivery → Delivered. You can track all orders from your Orders page.",
        "returns": "If a customer requests a return, the order status changes to 'Return Requested'. Once approved, inventory is restored automatically.",
        "payments": "Currently, KisanSetu supports Cash on Delivery (COD), UPI, Card, and Net Banking through our secure payment system.",
        "pricing": "Set competitive prices using our Price Intelligence tool. It shows current market prices, trends, and suggests an optimal selling range.",
        "dashboard": "Your dashboard shows: Total Products, Active Listings, Inventory, Revenue, Orders, Profit/Loss, and Sales Trends.",
    }
    
    CROP_INFO = {
        "tomato": "Tomatoes grow best in 20-35°C, need regular watering, and take 60-80 days to harvest. Best planted in spring/summer.",
        "potato": "Potatoes prefer 15-25°C, need well-drained soil, and take 90-120 days. Best planted in winter/early spring.",
        "onion": "Onions grow in 15-30°C, need moderate water, and take 100-150 days. Best planted in autumn/winter.",
        "carrot": "Carrots prefer cool weather (15-25°C), need loose soil, and take 70-80 days. Best in autumn/winter.",
        "spinach": "Spinach thrives in 10-25°C, needs moist soil, and can be harvested in 40-50 days. Best in cool seasons.",
    }
    
    async def generate(self, prompt: str, system_prompt: str = "",
                       context: Optional[Dict] = None) -> str:
        prompt_lower = prompt.lower()
        responses = []
        
        # Context-aware responses (order status, delivery, etc.)
        if context:
            if "order_data" in context:
                order = context["order_data"]
                responses.append(f"Your order #{order.get('order_number', 'N/A')} is currently **{order.get('status', 'unknown')}**. "
                        f"Total: ₹{order.get('total', 0):.2f}. "
                        f"{'Estimated delivery: ' + str(order.get('estimated_delivery_time', '')) if order.get('estimated_delivery_time') else ''}")
            
            if "product_data" in context:
                product = context["product_data"]
                responses.append(f"**{product.get('name', '')}** is priced at ₹{product.get('price', 0)}/{product.get('unit', 'kg')}. "
                        f"Available quantity: {product.get('available_quantity', 0)} {product.get('unit', 'kg')}. "
                        f"{'🌿 Organic certified. ' if product.get('is_organic') else ''}"
                        f"From {product.get('location', 'local farm')}.")
        
        # System help questions
        for key, answer in self.SYSTEM_KNOWLEDGE.items():
            if key.replace("_", " ") in prompt_lower or key in prompt_lower:
                responses.append(answer)
        
        # Crop information
        for crop, info in self.CROP_INFO.items():
            if crop in prompt_lower:
                responses.append(info)
        
        # General patterns
        if any(w in prompt_lower for w in ["hello", "hi", "hey", "namaste"]):
            responses.append("Namaste! 🙏 I'm your KisanSetu AI assistant. I can help you with:\n- 📊 Market prices and price suggestions\n- 🌾 Crop recommendations\n- 🌤️ Weather information\n- 📦 Order management\n- 💡 Tips for using KisanSetu")
        
        if any(w in prompt_lower for w in ["price", "rate", "cost"]):
            responses.append("I can help with pricing! Use the **Price Intelligence** tool in your dashboard to see:\n"
                    "- Current market prices\n- Price trends\n- Suggested selling range")
        
        if any(w in prompt_lower for w in ["weather", "rain", "temperature"]):
            responses.append("Check the **Weather** section in your dashboard for:\n"
                    "- Current conditions\n- 7-day forecast\n- Agricultural insights\n"
                    "Weather data helps you plan harvesting and irrigation.")
        
        if any(w in prompt_lower for w in ["recommend", "what to grow", "next crop", "suggestion"]):
            responses.append("For crop recommendations, visit the **Crop Recommendation** section. It analyzes:\n"
                    "- Current season and weather\n- Market demand\n- Price trends\n- Supply levels")
        
        if any(w in prompt_lower for w in ["order", "delivery", "track"]):
            responses.append("You can manage orders from the **Orders** page:\n"
                    "- View all incoming orders\n- Update order status\n- Track deliveries\n"
                    "- Handle returns and cancellations\n"
                    "Orders automatically update your inventory.")
        
        if any(w in prompt_lower for w in ["help", "how to", "guide"]):
            responses.append("Here's a quick guide to KisanSetu:\n"
                    "1. **Add Products**: Dashboard → Add Product → Fill details → Save\n"
                    "2. **Manage Inventory**: Stock updates automatically with orders\n"
                    "3. **Price Intelligence**: Get market prices and selling suggestions\n"
                    "4. **Orders**: View, confirm, and track all orders\n"
                    "5. **Weather**: Check forecasts for farming decisions\n"
                    "6. **Crop Recommendations**: Data-driven next-crop suggestions")
        
        if responses:
            # Deduplicate responses to avoid repeating the same information
            unique_responses = []
            for r in responses:
                if r not in unique_responses:
                    unique_responses.append(r)
            return "\n\n---\n\n".join(unique_responses)
        
        return ("I'm your KisanSetu AI assistant. I can help you with:\n"
                "- 📊 Market prices and pricing advice\n"
                "- 🌾 What crop to grow next\n"
                "- 🌤️ Weather and forecasts\n"
                "- 📦 Managing orders and inventory\n"
                "- 💡 Using KisanSetu features\n\n"
                "Try asking something specific, like 'What is the market price of tomato?' or 'How do I add a product?'")
from google import genai

class GeminiLLMProvider(LLMProvider):
    """Real LLM provider using Google's Gemini API."""

    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    async def generate(self, prompt: str, system_prompt: str = "", context: Optional[Dict] = None) -> str:
        full_prompt = f"{system_prompt}\n\nUser: {prompt}" if system_prompt else prompt
        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt
        )
        return response.text

def get_llm_provider() -> LLMProvider:
    """Factory function to get configured LLM provider."""
    # Forced to MockLLMProvider for hackathon judging due to Google Gemini AQ key issues
    return MockLLMProvider()
