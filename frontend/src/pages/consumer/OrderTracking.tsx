import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { deliveryAPI, ordersAPI } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Truck, MapPin, Package, Clock, CheckCircle2, Phone, ChevronLeft, Loader2, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// Custom map icons
const createIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const farmerIcon = createIcon('green');
const consumerIcon = createIcon('red');
const truckIcon = createIcon('blue');

const OrderTracking = () => {
  const { id } = useParams();
  const [tracking, setTracking] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTracking = async () => {
    try {
      // In a real app we'd fetch both the order and its tracking data
      // const orderRes = await ordersAPI.getById(Number(id));
      // setOrder(orderRes.data);
      // const trackRes = await deliveryAPI.getTracking(Number(id));
      // setTracking(trackRes.data);

      // Mock data for UI
      setTimeout(() => {
        setOrder({
          id: id,
          status: 'out_for_delivery',
          total: 450,
          created_at: new Date().toISOString(),
          items: [{ name: 'Organic Tomatoes', quantity: 2, price: 40 }]
        });

        setTracking({
          delivery: {
            status: 'in_transit',
            pickup_latitude: 18.5204,
            pickup_longitude: 73.8567,
            delivery_latitude: 18.5504,
            delivery_longitude: 73.8967,
            current_latitude: 18.5350,
            current_longitude: 73.8750,
            distance_remaining_km: 2.4,
            estimated_arrival: new Date(Date.now() + 15 * 60000).toISOString(),
            agent_name: 'Rajesh Kumar',
            agent_phone: '+91 9876543210'
          },
          route_coordinates: [
            [18.5204, 73.8567],
            [18.5250, 73.8600],
            [18.5350, 73.8750], // Current pos
            [18.5450, 73.8850],
            [18.5504, 73.8967]
          ],
          progress_percent: 65
        });
        setLoading(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();

    // Simulate real-time movement every 10 seconds
    const interval = setInterval(() => {
      // API call to simulateStep would go here
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
      </div>
    );
  }

  const t = tracking?.delivery;
  const isDelivered = t?.status === 'delivered';

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <Link to="/consumer/orders" className="flex items-center text-gray-500 hover:text-green-600 font-medium mb-6 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Orders
        </Link>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Tracking Details */}
          <div className="lg:w-1/3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
            >
              <h2 className="text-xl font-bold text-gray-900 font-heading mb-6">Track Order #{id}</h2>

              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100">
                  <div
                    className="absolute top-0 w-full bg-green-500 transition-all duration-1000"
                    style={{ height: `${tracking.progress_percent}%` }}
                  ></div>
                </div>

                <div className="space-y-8">
                  {/* Step 1: Confirmed */}
                  <div className="relative flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10 shadow-md">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="font-bold text-gray-900">Order Confirmed</p>
                      <p className="text-xs text-gray-500">Farmer accepted your order</p>
                    </div>
                  </div>

                  {/* Step 2: Picked up */}
                  <div className="relative flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-md ${tracking.progress_percent > 10 ? 'bg-green-500' : 'bg-white border-2 border-gray-200'}`}>
                      <Package className={`w-4 h-4 ${tracking.progress_percent > 10 ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="ml-4">
                      <p className={`font-bold ${tracking.progress_percent > 10 ? 'text-gray-900' : 'text-gray-400'}`}>Picked up</p>
                      <p className="text-xs text-gray-500">Package collected from farm</p>
                    </div>
                  </div>

                  {/* Step 3: In Transit */}
                  <div className="relative flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-md ${tracking.progress_percent > 50 ? 'bg-blue-500' : 'bg-white border-2 border-gray-200'}`}>
                      <Truck className={`w-4 h-4 ${tracking.progress_percent > 50 ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="ml-4">
                      <p className={`font-bold ${tracking.progress_percent > 50 ? 'text-gray-900' : 'text-gray-400'}`}>In Transit</p>
                      <p className="text-xs text-gray-500">Delivery partner is on the way</p>
                    </div>
                  </div>

                  {/* Step 4: Delivered */}
                  <div className="relative flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-md ${isDelivered ? 'bg-green-500' : 'bg-white border-2 border-gray-200'}`}>
                      <MapPin className={`w-4 h-4 ${isDelivered ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="ml-4">
                      <p className={`font-bold ${isDelivered ? 'text-gray-900' : 'text-gray-400'}`}>Delivered</p>
                      <p className="text-xs text-gray-500">Package arrived at destination</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="font-bold text-gray-900 font-heading mb-4">Delivery Partner</h3>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-600">{t?.agent_name.charAt(0)}</span>
                </div>
                <div className="ml-3 flex-grow">
                  <p className="font-bold text-gray-900">{t?.agent_name}</p>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Star className="w-3 h-3 text-yellow-500 mr-1 fill-current" /> 4.8
                  </p>
                </div>
                <a href={`tel:${t?.agent_phone}`} className="p-3 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Map View */}
          <div className="lg:w-2/3 h-[600px]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full overflow-hidden relative"
            >
              {!isDelivered && (
                <div className="absolute top-4 left-4 right-4 z-[1000] bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-lg border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Estimated Arrival</p>
                    <p className="text-xl font-bold text-gray-900 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-500" />
                      {new Date(t?.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 font-medium">Distance</p>
                    <p className="text-xl font-bold text-gray-900">{t?.distance_remaining_km} km</p>
                  </div>
                </div>
              )}

              {t && (
                <MapContainer
                  center={[t.current_latitude, t.current_longitude]}
                  zoom={13}
                  style={{ height: '100%', width: '100%', zIndex: 1 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  {/* Farmer Location */}
                  <Marker position={[t.pickup_latitude, t.pickup_longitude]} icon={farmerIcon}>
                    <Popup>Farm Location</Popup>
                  </Marker>

                  {/* Customer Location */}
                  <Marker position={[t.delivery_latitude, t.delivery_longitude]} icon={consumerIcon}>
                    <Popup>Delivery Address</Popup>
                  </Marker>

                  {/* Truck Location */}
                  {!isDelivered && (
                    <Marker position={[t.current_latitude, t.current_longitude]} icon={truckIcon}>
                      <Popup>Delivery Partner</Popup>
                    </Marker>
                  )}

                  {/* Route Line */}
                  {tracking.route_coordinates && (
                    <Polyline
                      positions={tracking.route_coordinates}
                      color="#3b82f6"
                      weight={5}
                      opacity={0.7}
                      dashArray="10, 10"
                    />
                  )}
                </MapContainer>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
