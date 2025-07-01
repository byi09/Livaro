'use client';

import React, { useState } from 'react';
import { X, MapPin, Bed, Bath, Square, Phone, Mail, MessageCircle, Heart, Share2, Calendar, DollarSign, Car, Home, Clock } from 'lucide-react';
import { PropertyListing } from '@/lib/types';
import { formatPrice, capitalizeFirstLetter, trimZeros } from '@/utils/formatters';
import Image from 'next/image';

interface PropertyDetailModalProps {
  property: PropertyListing | null;
  onClose: () => void;
  onContact: (property: PropertyListing, method: 'phone' | 'email' | 'message') => void;
}

export default function PropertyDetailModal({ 
  property, 
  onClose, 
  onContact 
}: PropertyDetailModalProps) {
  const [isSaved, setIsSaved] = useState(false);

  if (!property) return null;

  const handleContact = (method: 'phone' | 'email' | 'message') => {
    onContact(property, method);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // TODO: Implement save functionality
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: property.property_listings.listingTitle || 'Property Listing',
        text: `Check out this property: ${formatPrice(parseFloat(property.property_listings.monthlyRent))}/mo`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header with Image */}
        <div className="relative">
          <Image
            src="/hero-bg.jpg"
            alt={property.property_listings.listingTitle || "Property Image"}
            className="w-full h-72 object-cover"
            width={800}
            height={288}
          />
          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
          
          {/* Action buttons */}
          <div className="absolute top-4 left-4 flex gap-3">
            <button
              onClick={handleSave}
              className={`p-2 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm ${
                isSaved 
                  ? 'bg-red-500 text-white shadow-red-200' 
                  : 'bg-white/90 text-gray-700 hover:bg-white'
              }`}
            >
              <Heart className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 text-gray-700"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          {/* Price overlay */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900">
              {formatPrice(parseFloat(property.property_listings.monthlyRent))}
              <span className="text-lg font-normal text-gray-600">/month</span>
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row max-h-[calc(95vh-18rem)]">
          {/* Main Details */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Title and Address */}
            <div className="mb-6">
              {property.property_listings.listingTitle && (
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {property.property_listings.listingTitle}
                </h2>
              )}
              
              <div className="flex items-start gap-2 mb-4">
                <MapPin className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-lg text-gray-900 font-medium">
                    {property.properties.addressLine1}
                    {property.properties.addressLine2 && (
                      <span>, {property.properties.addressLine2}</span>
                    )}
                  </p>
                  <p className="text-gray-600">
                    {property.properties.city}, {property.properties.state} {property.properties.zipCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bed className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bedrooms</p>
                  <p className="font-semibold text-gray-900">
                    {property.properties.bedrooms > 0
                      ? `${property.properties.bedrooms}`
                      : 'Studio'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bath className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bathrooms</p>
                  <p className="font-semibold text-gray-900">{trimZeros(property.properties.bathrooms)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Square className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sq Ft</p>
                  <p className="font-semibold text-gray-900">
                    {property.properties.squareFootage && property.properties.squareFootage > 0 
                      ? property.properties.squareFootage 
                      : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Home className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-semibold text-gray-900">{capitalizeFirstLetter(property.properties.propertyType)}</p>
                </div>
              </div>
            </div>

            {/* Property Description */}
            {property.properties.description && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {property.properties.description}
                </p>
              </div>
            )}

            {/* Additional Details */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Property Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.property_listings.securityDeposit && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="text-sm text-gray-500">Security Deposit</span>
                      <p className="font-semibold text-gray-900">
                        {formatPrice(parseFloat(property.property_listings.securityDeposit))}
                      </p>
                    </div>
                  </div>
                )}
                
                {property.property_listings.availableDate && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-sm text-gray-500">Available Date</span>
                      <p className="font-semibold text-gray-900">
                        {new Date(property.property_listings.availableDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                {property.properties.yearBuilt && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Home className="w-5 h-5 text-purple-600" />
                    <div>
                      <span className="text-sm text-gray-500">Year Built</span>
                      <p className="font-semibold text-gray-900">{property.properties.yearBuilt}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Car className="w-5 h-5 text-orange-600" />
                  <div>
                    <span className="text-sm text-gray-500">Parking</span>
                    <p className="font-semibold text-gray-900">
                      {property.properties.parkingSpaces && property.properties.parkingSpaces > 0 
                        ? `${property.properties.parkingSpaces} space${property.properties.parkingSpaces > 1 ? 's' : ''}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Sidebar */}
          <div className="lg:w-80 bg-gray-50 p-6 border-t lg:border-t-0 lg:border-l border-gray-200">
            <div className="sticky top-0">
              <h3 className="text-lg font-semibold mb-4">Contact Property Manager</h3>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  ✨ <strong>Easy Communication:</strong> Connect directly with the property owner through our secure messaging platform, or contact them via phone or email.
                </p>
              </div>

              {/* Contact Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 mb-4">
                <button
                  onClick={() => handleContact('message')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Send Message</span>
                </button>
                
                <button
                  onClick={() => handleContact('phone')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call Now</span>
                </button>
                
                <button
                  onClick={() => handleContact('email')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  <Mail className="w-5 h-5" />
                  <span>Send Email</span>
                </button>
              </div>

              <p className="text-sm text-gray-500 text-center">
                💬 Average response time: Usually within 1 hour
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 