import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Leaf, Search, MapPin, ArrowRight, ShieldCheck, Truck, Star } from 'lucide-react';

const ConsumerHome = () => {
  return (
    <div className="min-h-screen bg-transparent pb-20">
      
      {/* Modern Split-Layout Hero */}
      <div className="relative pt-24 lg:pt-32 pb-20 lg:pb-32 overflow-hidden">
        
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -z-10 w-full h-full overflow-hidden opacity-40">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-b from-green-200 to-green-100 blur-3xl opacity-50 mix-blend-multiply"></div>
          <div className="absolute top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-b from-emerald-100 to-teal-100 blur-3xl opacity-50 mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            
            {/* Hero Content */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left pt-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center justify-center bg-white border border-green-100 rounded-full px-4 py-2 mb-6 shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                  <span className="text-green-800 text-xs font-bold tracking-widest uppercase">100% Organic & Farm Fresh</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-heading text-gray-900 leading-[1.1] mb-6">
                  Direct from farm,<br />
                  <span className="text-transparent bg-clip-text gradient-text">straight to you.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
                  Skip the middlemen. Experience the true taste of India by buying fresh, organic produce directly from local farmers at fair prices.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link 
                    to="/consumer/marketplace" 
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center group"
                  >
                    Start Shopping 
                    <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    to="/register" 
                    className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-bold text-lg py-4 px-8 rounded-2xl shadow-sm transition-all"
                  >
                    Join as Farmer
                  </Link>
                </div>
                
                <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <img key={i} className="w-8 h-8 rounded-full border-2 border-white" src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                    <span className="font-medium text-gray-700">Trusted by 10,000+ customers</span>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Hero Image/Cards */}
            <div className="w-full lg:w-1/2 relative h-[500px] lg:h-[600px] flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-full max-w-md aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl"
              >
                <img 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop" 
                  alt="Fresh Vegetables" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {/* Floating UI Elements */}
                <motion.div 
                  className="absolute bottom-8 left-8 right-8 glass rounded-2xl p-4 flex items-center gap-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-bold text-sm">Delivery Arrived</h4>
                    <p className="text-gray-500 text-xs">Fresh tomatoes from Ramesh's Farm</p>
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Decorative Floating Icon */}
              <motion.div 
                animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute top-10 right-10 bg-white p-4 rounded-2xl shadow-xl border border-gray-100"
              >
                <Leaf className="w-8 h-8 text-green-500" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-green-600 uppercase mb-3">Why KisanSetu?</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 font-heading">A better way to buy food</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-3xl p-8 border border-gray-100 card-hover"
            >
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-green-600">
                <Leaf className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 font-heading mb-3">Peak Freshness</h4>
              <p className="text-gray-600 leading-relaxed">
                Produce is harvested only after you order. It goes from the soil to your kitchen in hours, not weeks.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="gradient-primary rounded-3xl p-8 shadow-xl shadow-green-500/20 card-hover transform md:-translate-y-4"
            >
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center mb-6 text-white">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-bold text-white font-heading mb-3">Fair Trade</h4>
              <p className="text-green-50 leading-relaxed">
                We take zero commission from farmers. 100% of the produce cost goes directly to the people who grow it.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 rounded-3xl p-8 border border-gray-100 card-hover"
            >
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-green-600">
                <Truck className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 font-heading mb-3">Direct Delivery</h4>
              <p className="text-gray-600 leading-relaxed">
                Live order tracking ensures you know exactly when your fresh groceries will arrive at your door.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 font-heading mb-2">Shop by Category</h2>
              <p className="text-gray-600">Explore the freshest arrivals from local farms.</p>
            </div>
            <Link to="/consumer/marketplace" className="hidden sm:flex items-center text-green-600 font-bold hover:text-green-700 transition-colors">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Vegetables', img: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?q=80&w=800', count: '120+ items' },
              { name: 'Fruits', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800', count: '85+ items' },
              { name: 'Grains & Pulses', img: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=800', count: '45+ items' },
              { name: 'Spices', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800', count: '60+ items' }
            ].map((cat, idx) => (
              <Link to={`/consumer/marketplace?category=${cat.name}`} key={idx}>
                <motion.div 
                  whileHover={{ y: -8 }}
                  className="relative rounded-[2rem] overflow-hidden h-72 shadow-sm border border-gray-100 cursor-pointer group bg-white"
                >
                  <div className="absolute inset-2 rounded-3xl overflow-hidden">
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent"></div>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white text-2xl font-bold font-heading mb-1">{cat.name}</h3>
                    <p className="text-green-300 text-sm font-medium">{cat.count}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
            <Link to="/consumer/marketplace" className="inline-flex items-center justify-center w-full bg-white border border-gray-200 text-gray-900 font-bold py-3 px-6 rounded-xl hover:bg-gray-50">
              View all categories
            </Link>
          </div>
        </div>
      </section>
      
    </div>
  );
};

// Extracted from original code since it wasn't imported properly at top
import { CheckCircle } from 'lucide-react';

export default ConsumerHome;
