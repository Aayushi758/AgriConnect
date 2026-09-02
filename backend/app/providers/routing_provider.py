"""Routing provider interface with mock implementation for delivery routes."""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple, Optional
import math
import random
from app.config import get_settings

settings = get_settings()


class RoutingProvider(ABC):
    @abstractmethod
    async def get_route(self, origin: Tuple[float, float], 
                        destination: Tuple[float, float],
                        waypoints: Optional[List[Tuple[float, float]]] = None) -> Dict[str, Any]:
        pass


class MockRoutingProvider(RoutingProvider):
    """Mock routing that generates realistic routes between coordinates."""
    
    async def get_route(self, origin: Tuple[float, float],
                        destination: Tuple[float, float],
                        waypoints: Optional[List[Tuple[float, float]]] = None) -> Dict[str, Any]:
        
        # Calculate straight-line distance
        distance_km = self._haversine(origin[0], origin[1], destination[0], destination[1])
        
        # Road distance is ~1.3x straight-line
        road_distance = distance_km * 1.3
        
        # Average speed 30 km/h in city
        duration_minutes = (road_distance / 30) * 60
        
        # Generate intermediate points for a realistic route
        coordinates = self._generate_route_points(origin, destination, waypoints)
        
        return {
            "coordinates": coordinates,
            "total_distance_km": round(road_distance, 2),
            "total_duration_minutes": round(duration_minutes, 1),
            "polyline": None,  # Would be encoded polyline from real API
            "provider": "mock",
            "waypoints": waypoints or [],
        }
    
    def _haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371  # Earth's radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat/2)**2 + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    def _generate_route_points(self, origin: Tuple[float, float],
                                destination: Tuple[float, float],
                                waypoints: Optional[List[Tuple[float, float]]] = None,
                                num_intermediate: int = 20) -> List[List[float]]:
        """Generate a set of intermediate points that simulate a road route."""
        all_points = [origin]
        if waypoints:
            all_points.extend(waypoints)
        all_points.append(destination)
        
        route = []
        for i in range(len(all_points) - 1):
            start = all_points[i]
            end = all_points[i + 1]
            segment_points = self._interpolate_with_road_noise(start, end, num_intermediate)
            route.extend(segment_points)
        
        route.append(list(destination))
        return route
    
    def _interpolate_with_road_noise(self, start: Tuple[float, float],
                                      end: Tuple[float, float],
                                      num_points: int) -> List[List[float]]:
        """Interpolate between two points with slight random deviation to simulate roads."""
        points = []
        for i in range(num_points):
            t = i / num_points
            lat = start[0] + (end[0] - start[0]) * t
            lon = start[1] + (end[1] - start[1]) * t
            
            # Add slight road-like deviation
            noise = random.gauss(0, 0.001) * (1 - abs(2 * t - 1))  # More noise in middle
            lat += noise
            lon += noise * 0.8
            
            points.append([round(lat, 6), round(lon, 6)])
        
        return points


def get_routing_provider() -> RoutingProvider:
    if settings.ROUTING_PROVIDER == "mock":
        return MockRoutingProvider()
    return MockRoutingProvider()
