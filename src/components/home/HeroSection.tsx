'use client';

import { motion } from 'framer-motion';
import PropertySearch from '../PropertySearch';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

interface HeroSectionProps {
  isUnauthenticated?: boolean;
}

export default function HeroSection({ isUnauthenticated = false }: HeroSectionProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section with background image */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white pt-24 pb-32 overflow-hidden min-h-screen"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/hero-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-y-12"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center min-h-screen">
          <div className="text-center mb-16">
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
            >
              Find your place.
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl text-blue-100 mb-16 max-w-4xl mx-auto leading-relaxed"
            >
              Discover amazing properties! Browse ideal locations with our comprehensive search tools.
            </motion.p>
          </div>

          <motion.div variants={itemVariants}>
            <PropertySearch />
          </motion.div>
        </div>
      </motion.section>

      {/* Three Feature Sections */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Find or list properties section */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Find or list properties with ease
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Description
            </p>
            
            {/* Property showcase grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gray-100 rounded-xl aspect-square relative overflow-hidden group hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="font-semibold">$2000/month</p>
                    <p className="text-sm">2 bed • 2 bath • 1000 sqft</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Property stats */}
            <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[1,2,3,4,5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  ))}
                </div>
                <span>4.9 out of 5 stars</span>
              </div>
              <div>132 Properties</div>
              <div>4.2 miles from</div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <div className="bg-gray-50 rounded-full px-6 py-2 flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Verified</span>
              </div>
            </div>
          </motion.div>

          {/* Communication section */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Secure and streamlined communication
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Description
            </p>
            
            {/* Communication interface mockup */}
            <div className="max-w-4xl mx-auto bg-gray-100 rounded-2xl p-8 relative overflow-hidden">
              <div className="flex space-x-6">
                {/* Left side - Filter panel */}
                <div className="w-1/3 space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="font-semibold mb-3 text-gray-800">Filter By Tags</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Finance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Available</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Marketing</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Chat interface */}
                <div className="w-2/3">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Chat messages */}
                    <div className="p-4 space-y-3">
                      {/* User message */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <div className="bg-gray-50 rounded-lg px-4 py-2 max-w-xs">
                          <p className="text-sm text-gray-800">Test User</p>
                          <p className="text-xs text-gray-500">Is this property still available?</p>
                        </div>
                      </div>
                      
                      {/* Another user message */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex-shrink-0"></div>
                        <div className="bg-gray-50 rounded-lg px-4 py-2 max-w-xs">
                          <p className="text-sm text-gray-800">Test User</p>
                          <p className="text-xs text-gray-500">When can I schedule a viewing?</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chat input */}
                    <div className="border-t border-gray-200 p-4">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="text" 
                          placeholder="Type a message..." 
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          readOnly
                        />
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating user avatar */}
              <div className="absolute bottom-4 left-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full shadow-lg"></div>
              </div>
            </div>
          </motion.div>

          {/* AI Features section */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Smart features and AI driven insights
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Description
            </p>
            
            {/* AI Interface mockup */}
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left side - AI Overview */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Overview</h3>
                    <p className="text-sm text-gray-600">
                      This property is 2.3 miles from UC Berkeley, including a bedroom and bathroom. It features WiFi and neighborhood but some complain about the noise.
                    </p>
                  </div>
                  
                  {/* Search interface */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">Tell me about location, price...</span>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Chat interface */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Chat header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">Ask Properties</h3>
                      <button className="text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Chat content */}
                  <div className="p-4 space-y-4 bg-gray-50 min-h-[200px]">
                    {/* AI response suggestions */}
                    <div className="space-y-2">
                      <div className="bg-blue-100 rounded-lg px-3 py-2 inline-block">
                        <span className="text-sm text-blue-800">Location</span>
                      </div>
                      <div className="bg-green-100 rounded-lg px-3 py-2 inline-block ml-2">
                        <span className="text-sm text-green-800">Price Range</span>
                      </div>
                      <div className="bg-purple-100 rounded-lg px-3 py-2 inline-block ml-2">
                        <span className="text-sm text-purple-800">Amenities</span>
                      </div>
                      <div className="bg-orange-100 rounded-lg px-3 py-2 inline-block ml-2">
                        <span className="text-sm text-orange-800">Safety</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        placeholder="Ask about this property..." 
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        readOnly
                      />
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Person with laptop */}
              <div className="mt-8 flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full shadow-lg flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}