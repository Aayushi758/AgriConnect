import React, { useState, useEffect } from 'react';
import { aiAPI, weatherAPI } from '../../services/api';
import { Bot, TrendingUp, CloudRain, Sprout, Search, ArrowRight, Loader2, Cloud, Sun, Wind, Droplets } from 'lucide-react';

const AIPortal = () => {
  const [cropQuery, setCropQuery] = useState('');
  const [activeTab, setActiveTab] = useState('price');
  const [location, setLocation] = useState('Pune');
  
  // Data States
  const [priceIntel, setPriceIntel] = useState<any>(null);
  const [cropRecs, setCropRecs] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  
  // Loading States
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => {
    fetchWeather();
    fetchRecommendations();
  }, []);

  const fetchWeather = async () => {
    setLoadingWeather(true);
    try {
      const res = await weatherAPI.getCurrent(location);
      setWeather(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWeather(false);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await aiAPI.cropRecommendations({ location, season: 'monsoon' });
      setCropRecs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handlePriceSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropQuery.trim()) return;
    
    setLoadingPrice(true);
    try {
      const res = await aiAPI.priceIntelligence({ 
        crop_name: cropQuery, 
        current_selling_price: 0,
        location
      });
      setPriceIntel(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrice(false);
    }
  };

  const renderWeatherIcon = (desc: string) => {
    if (!desc) return <Cloud className="h-10 w-10 text-gray-400" />;
    desc = desc.toLowerCase();
    if (desc.includes('rain')) return <CloudRain className="h-10 w-10 text-blue-500" />;
    if (desc.includes('sun') || desc.includes('clear')) return <Sun className="h-10 w-10 text-yellow-500" />;
    return <Cloud className="h-10 w-10 text-gray-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <div className="bg-green-100 p-3 rounded-full mr-4 shadow-inner">
          <Bot className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">AI Assistant Portal</h1>
          <p className="text-gray-500 mt-1">Smart insights for your farming business</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('price')}
          className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'price' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Price Intelligence
        </button>
        <button 
          onClick={() => setActiveTab('crop')}
          className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'crop' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Crop Recommendations
        </button>
        <button 
          onClick={() => setActiveTab('weather')}
          className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'weather' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Weather Forecast
        </button>
      </div>

      {/* Price Intelligence */}
      {activeTab === 'price' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 font-heading mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" /> Market Price Analysis
            </h3>
            <form onSubmit={handlePriceSearch} className="flex gap-4 max-w-2xl">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Enter crop name (e.g. Tomato, Onion)..."
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl w-full focus:ring-green-500 focus:border-green-500 outline-none"
                  value={cropQuery}
                  onChange={(e) => setCropQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                disabled={loadingPrice || !cropQuery.trim()}
                className="btn-accent w-auto min-w-[120px] disabled:opacity-70 disabled:hover:-translate-y-0 disabled:hover:shadow-md"
              >
                {loadingPrice ? <Loader2 className="animate-spin h-5 w-5" /> : 'Analyze'}
              </button>
            </form>
          </div>

          {priceIntel && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm font-medium text-gray-500 mb-1">Current Market Price</p>
                <p className="text-3xl font-bold text-gray-900">₹{priceIntel.current_market_price} <span className="text-sm font-normal text-gray-500">/ {priceIntel.unit}</span></p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Suggested Range</p>
                  <p className="font-medium text-green-700">₹{priceIntel.suggested_selling_price_min} - ₹{priceIntel.suggested_selling_price_max}</p>
                </div>
              </div>
              <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h4 className="font-bold text-gray-900 mb-3">AI Analysis</h4>
                <p className="text-gray-700 leading-relaxed bg-green-50 p-4 rounded-xl border border-green-100">
                  {priceIntel.explanation}
                </p>
                {priceIntel.is_synthetic && (
                  <p className="text-xs text-gray-400 mt-4 italic">* Based on predictive modelling and historical trends.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crop Recommendations */}
      {activeTab === 'crop' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-heading flex items-center">
                <Sprout className="h-5 w-5 mr-2 text-green-600" /> What to grow next?
              </h3>
              <p className="text-sm text-gray-500 mt-1">Based on location ({location}), season, and demand forecasts.</p>
            </div>
            <button 
              onClick={fetchRecommendations}
              className="text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh Data
            </button>
          </div>

          {loadingRecs ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-green-600" /></div>
          ) : Array.isArray(cropRecs) && cropRecs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cropRecs.map((rec: any, idx: number) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
                    Match Score: {Math.round(rec.score || rec.confidence_score * 100)}%
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2 capitalize">{rec.recommended_crop}</h4>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm flex justify-between"><span className="text-gray-500">Demand:</span> <span className="font-medium text-gray-900 capitalize">{rec.expected_demand}</span></p>
                    <p className="text-sm flex justify-between"><span className="text-gray-500">Price Trend:</span> <span className="font-medium text-gray-900 capitalize">{rec.expected_price_trend}</span></p>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    "{rec.reason}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weather */}
      {activeTab === 'weather' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-heading flex items-center">
                <CloudRain className="h-5 w-5 mr-2 text-blue-500" /> Agricultural Weather
              </h3>
              <p className="text-sm text-gray-500 mt-1">Current conditions for {location}</p>
            </div>
            <button 
              onClick={fetchWeather}
              className="text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh Data
            </button>
          </div>

          {loadingWeather ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-green-600" /></div>
          ) : weather && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10">
                <Cloud className="w-64 h-64 -mt-10 -mr-10" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  {renderWeatherIcon(weather.condition)}
                  <div>
                    <h2 className="text-5xl font-light">{weather.temperature_c}°C</h2>
                    <p className="text-blue-100 text-lg capitalize mt-1">{weather.condition}</p>
                  </div>
                </div>
                <div className="flex gap-8 bg-black/20 p-6 rounded-2xl backdrop-blur-sm">
                  <div>
                    <p className="text-blue-200 text-sm mb-1 flex items-center"><Droplets className="h-4 w-4 mr-1" /> Humidity</p>
                    <p className="text-2xl font-semibold">{weather.humidity_percent}%</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm mb-1 flex items-center"><Wind className="h-4 w-4 mr-1" /> Wind</p>
                    <p className="text-2xl font-semibold">{weather.wind_speed_kmh} km/h</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/20">
                <h4 className="font-medium text-blue-100 mb-3">AI Agricultural Insight</h4>
                <p className="bg-white/10 p-4 rounded-xl text-sm leading-relaxed backdrop-blur-md">
                  {weather.agricultural_insight}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIPortal;
