'use client';

import React, { useState } from 'react';
import { X, MapPin, Phone, Mail, MessageCircle, Heart, Share2, Bed, Bath, Home, Car } from 'lucide-react';
import { PropertyListing } from '@/lib/types';
import { formatPrice } from '@/utils/formatters';
import Image from 'next/image';

interface PropertyDetailModalProps {
  property: PropertyListing | null;
  onClose: () => void;
  onContact: (property: PropertyListing, method: 'phone' | 'email' | 'message') => void;
}

const loveHighlightsPool = [
  "Prime Location – Walking distance to shopping, dining, and entertainment",
  "Modern Amenities – Updated with contemporary finishes",
  "Great Transit – Easy access to public transportation",
  "Quiet Neighborhood – Peaceful and relaxing surroundings",
  "City Views – Panoramic skyline views from your windows",
  "Secure Access – Gated entry and security system",
  "Outdoor Space – Private balcony or patio",
  "Tech-Ready – Smart home features included",
  "Move-In Ready – Freshly painted and professionally cleaned"
];

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
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.property_listings.listingTitle || 'Property Listing',
        text: `Check out this property: ${formatPrice(parseFloat(property.property_listings.monthlyRent))}/mo`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const randomHighlights = loveHighlightsPool.sort(() => 0.5 - Math.random()).slice(0, 4);
  const rent = +property.property_listings.monthlyRent;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative">
          <Image
            src="/hero-bg.jpg"
            alt="Property"
            className="w-full h-72 object-cover"
            width={800}
            height={288}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow">
            <X className="w-5 h-5 text-gray-700" />
          </button>
          <div className="absolute top-4 left-4 flex gap-2">
            <button onClick={handleSave} className={`p-2 rounded-full shadow ${isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'}`}>
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button onClick={handleShare} className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white shadow">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute bottom-4 left-4 bg-white/90 px-4 py-2 rounded-lg shadow">
            <h1 className="text-xl font-bold text-gray-900">
              {formatPrice(rent)} 
              <span className="text-base font-normal text-gray-600"> /month</span>
            </h1>
          </div>
        </div>

        {/* Main */}
        <div className="flex flex-col lg:flex-row overflow-y-auto max-h-[calc(95vh-18rem)]">
          {/* Left Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Title & Address */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{property.property_listings.listingTitle}</h2>
              <div className="flex gap-2 items-start mt-2 text-gray-600">
                <MapPin className="w-5 h-5 mt-1" />
                <div>
                  <p>{property.properties.addressLine1}{property.properties.addressLine2 && `, ${property.properties.addressLine2}`}</p>
                  <p>{property.properties.city}, {property.properties.state} {property.properties.zipCode}</p>
                </div>
              </div>

              {/* Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <SummaryCard
                  icon="bed"
                  value={property.properties.bedrooms.toString()}
                  label="Bedrooms"
                  color="bg-blue-100 text-blue-600"
                />
                <SummaryCard
                  icon="bath"
                  value={property.properties.bathrooms.toString()}
                  label="Bathrooms"
                  color="bg-green-100 text-green-600"
                />
                <SummaryCard
                  icon="home"
                  value={`${property.properties.squareFootage} Sq Ft`}
                  label="Sq Ft"
                  color="bg-purple-100 text-purple-600"
                />
                <SummaryCard
                  icon="car"
                  value={(property.properties.parkingSpaces ?? 0).toString()}
                  label="Parking"
                  color="bg-orange-100 text-orange-600"
                />
              </div>
            </div>

            {/* About This Property */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">About This Property</h3>
              <p className="text-gray-700 leading-relaxed">{property.properties.description}</p>
            </div>

            {/* Why You'll Love Living Here */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Why You'll Love Living Here</h3>
              <ul className="space-y-2">
                {randomHighlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-1">✔</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Neighborhood & Schools */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Neighborhood & Schools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LocationBox title="Walk & Transit Scores" points={[
                  `Walk Score: ${78 + Math.floor(Math.random() * 10)}/100`,
                  `Transit Score: ${85 + Math.floor(Math.random() * 10)}/100`,
                  `Bike Score: ${75 + Math.floor(Math.random() * 10)}/100`
                ]} />
                <LocationBox title="Nearby Schools" points={[
                  `${property.properties.city} Elementary – 0.3 mi – ⭐${8 + Math.floor(Math.random() * 2)}/10`,
                  `${property.properties.city} Middle – 0.8 mi – ⭐${7 + Math.floor(Math.random() * 2)}/10`,
                  `${property.properties.city} High School – 1.2 mi – ⭐${8 + Math.floor(Math.random() * 2)}/10`
                ]} />
              </div>
            </div>

            {/* Monthly Cost Breakdown */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Monthly Cost Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LocationBox title="Base Costs" points={[
                  `Rent: ${formatPrice(rent)}`,
                  'Parking: $0 (included)',
                  'Pet Fee: $50'
                ]} />
                <LocationBox title="Estimated Utilities" points={[
                  'Electricity: $80–$120',
                  'Gas: $40–$60',
                  'Internet: $60–$80'
                ]} />
              </div>
              <p className="text-sm text-gray-600 mt-2">💰 <strong>Total Estimate:</strong> ${rent + 50 + 80}–${rent + 50 + 120 + 60 + 80}/month</p>
            </div>

            {/* Property Manager */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Meet Your Property Manager</h3>
              <div className="bg-white border p-4 rounded-md shadow-sm">
                <p className="font-semibold text-gray-800">Sarah Martinez</p>
                <p className="text-sm text-gray-500 mb-2">Licensed Property Manager</p>
                <p className="text-yellow-600 text-sm">⭐ 4.9/5 rating – 200+ reviews</p>
                <p className="text-sm italic text-gray-600 mt-2">"I'm here to help you find your perfect home!"</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 bg-gray-50 p-6 border-t lg:border-t-0 lg:border-l border-gray-200 shrink-0">
            <div className="sticky top-6 space-y-4">
              <h3 className="text-lg font-semibold">Interested in this property?</h3>
              <p className="text-sm text-gray-600">Contact us today to schedule a viewing</p>
              <div className="space-y-3">
                <button onClick={() => handleContact('message')} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg">
                  <MessageCircle className="w-5 h-5" />
                  Send Message
                </button>
                <button onClick={() => handleContact('phone')} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg">
                  <Phone className="w-5 h-5" />
                  Call Now
                </button>
                <button onClick={() => handleContact('email')} className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg">
                  <Mail className="w-5 h-5" />
                  Send Email
                </button>
              </div>
              <div className="text-sm text-gray-500">
                <p>⚡ Quick Response: We typically respond within <strong>1 hour</strong> during business hours</p>
                {property.property_listings.availableDate && (
                  <p className="mt-2">📅 <strong>Available:</strong> {new Date(property.property_listings.availableDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationBox({ title, points }: { title: string, points: string[] }) {
  return (
    <div className="bg-gray-100 p-4 rounded-md">
      <p className="font-semibold text-gray-700 mb-2">{title}</p>
      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
        {points.map((pt, i) => <li key={i}>{pt}</li>)}
      </ul>
    </div>
  );
}

function SummaryCard({ icon, value, label, color }: {
  icon: 'bed' | 'bath' | 'home' | 'car',
  value: string,
  label: string,
  color: string
}) {
  const icons = {
    bed: <Bed className="w-6 h-6" />,
    bath: <Bath className="w-6 h-6" />,
    home: <Home className="w-6 h-6" />,
    car: <Car className="w-6 h-6" />,
  };

  return (
    <div className="flex flex-col items-center border rounded-lg p-4 shadow-sm bg-white">
      <div className={`p-2 rounded-full ${color}`}>
        {icons[icon]}
      </div>
      <div className="mt-2 text-lg font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
