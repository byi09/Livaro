'use client';

import React, { useState } from 'react';
import { X, MapPin, Bed, Bath, Square, Phone, Mail, MessageCircle, Heart, Share2 } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative">
          <Image
            src="/hero-bg.jpg"
            alt={property.property_listings.listingTitle || "Property Image"}
            className="w-full h-64 object-cover"
            width={800}
            height={256}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={handleSave}
              className={`p-2 rounded-full shadow-md transition-all ${
                isSaved 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow text-gray-700 hover:bg-gray-50"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-16rem)]">
          {/* Price and Title */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {formatPrice(parseFloat(property.property_listings.monthlyRent))}/mo
            </h1>
            {property.property_listings.listingTitle && (
              <h2 className="text-xl text-gray-700 mb-2">
                {property.property_listings.listingTitle}
              </h2>
            )}
          </div>

          {/* Property Details */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>
                {property.properties.bedrooms > 0
                  ? `${property.properties.bedrooms} beds`
                  : 'Studio'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{trimZeros(property.properties.bathrooms)} baths</span>
            </div>
            <div className="flex items-center gap-1">
              <Square className="w-4 h-4" />
              <span>{property.properties.squareFootage} sqft</span>
            </div>
            <div className="text-gray-500">
              {capitalizeFirstLetter(property.properties.propertyType)} for rent
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 mb-6">
            <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-gray-900">
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

          {/* Property Description */}
          {property.properties.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {property.properties.description}
              </p>
            </div>
          )}

          {/* Additional Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {property.property_listings.securityDeposit && (
              <div>
                <span className="text-sm text-gray-500">Security Deposit</span>
                <p className="font-medium">
                  {formatPrice(parseFloat(property.property_listings.securityDeposit))}
                </p>
              </div>
            )}
            {property.property_listings.availableDate && (
              <div>
                <span className="text-sm text-gray-500">Available Date</span>
                <p className="font-medium">
                  {new Date(property.property_listings.availableDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {property.properties.yearBuilt && (
              <div>
                <span className="text-sm text-gray-500">Year Built</span>
                <p className="font-medium">{property.properties.yearBuilt}</p>
              </div>
            )}
            {property.properties.parkingSpaces && property.properties.parkingSpaces > 0 && (
              <div>
                <span className="text-sm text-gray-500">Parking</span>
                <p className="font-medium">{property.properties.parkingSpaces} spaces</p>
              </div>
            )}
          </div>

          {/* Contact Options */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Contact Property Manager</h3>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                ✨ <strong>Easy Communication:</strong> Connect directly with the property owner through our secure messaging platform, or contact them via phone or email.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <p className="text-sm text-gray-500 mt-3 text-center">
              💬 Average response time: Usually within 1 hour
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 