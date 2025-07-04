'use client';

import React, { useState, useEffect } from 'react';
import {
  X, MapPin, Phone, Mail, MessageCircle, Heart, Share2, Bed, Bath, Home, Car
} from 'lucide-react';
import { PropertyListing } from '@/lib/types';
import { formatPrice } from '@/utils/formatters';
import { createClient } from '@supabase/supabase-js';

interface PropertyDetailModalProps {
  property: PropertyListing | null;
  onClose: () => void;
  onContact: (property: PropertyListing, method: 'phone' | 'email' | 'message') => void;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchImages = async () => {
      if (!property?.properties?.id) return;

      const bucket = 'property-images';

      // ✅ Manual override for folder path
      const folderMap: Record<string, string> = {
        "58d18cd8-2edf-4841-9e4e-8e0dbf7d1e01": "14c20054-7b28-454e-aaf2-12ece2a4b7ee",
        "49673659-620f-43ff-8c12-f7a6617a207d": "49673659-620f-43ff-8c12-f7a6617a207d",
        "5bc214fc-b4db-4dec-abb9-0306c1577a1b": "5bc214fc-b4db-4dec-abb9-0306c1577a1b",
        "ac3c6957-b8c4-4698-a34e-90317f407a66": "ac3c6957-b8c4-4698-a34e-90317f407a66",
        "f86f7b0a-49d6-47eb-989f-b6ca6a1ed7bf": "14c20054-7b28-454e-aaf2-12ece2a4b7ee",
        // Add more if needed
      };

      const actualFolder = folderMap[property.properties.id];

      if (!actualFolder) {
        console.warn(`⚠️ No folder mapping found for property ID: ${property.properties.id}`);
        return;
      }

      const folderPath = `listings/${actualFolder}`;

      const { data: files, error } = await supabase
        .storage
        .from(bucket)
        .list(folderPath, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) {
        console.error(`❌ Supabase error:`, error.message);
        return;
      }

      if (!files || files.length === 0) {
        console.warn(`⚠️ No images found in folder: ${folderPath}`);
        return;
      }

      const urls = files.map(file =>
        supabase.storage.from(bucket).getPublicUrl(`${folderPath}/${file.name}`).data.publicUrl
      );

      setImageUrls(urls);
    };

    fetchImages();
  }, [property]);

  if (!property) return null;

  const handleContact = (method: 'phone' | 'email' | 'message') => {
    onContact(property, method);
  };

  const handleSave = () => setIsSaved(!isSaved);

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
        {/* Header Images */}
        <div className="relative overflow-hidden">
          {imageUrls.length > 0 ? (
            <div className="relative w-full h-72">
              {/* Main Image Display */}
              <div className="w-full h-full">
                <img 
                  src={imageUrls[currentImageIndex]} 
                  alt={`Property Image ${currentImageIndex + 1}`} 
                  className="w-full h-full object-cover rounded-lg shadow" 
                />
              </div>

              {/* Navigation Arrows */}
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? imageUrls.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 z-10"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === imageUrls.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 z-10"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Image Counter */}
              {imageUrls.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {imageUrls.length}
                </div>
              )}

              {/* Thumbnail Navigation */}
              {imageUrls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 px-3 py-2 rounded-full">
                  {imageUrls.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-72 bg-gray-200 flex items-center justify-center text-gray-500">
              No Image Available
            </div>
          )}

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
              {formatPrice(rent)}<span className="text-base font-normal text-gray-600"> /month</span>
            </h1>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex flex-col lg:flex-row overflow-y-auto max-h-[calc(95vh-18rem)]">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <SummaryCard icon="bed" value={property.properties.bedrooms.toString()} label="Bedrooms" color="bg-blue-100 text-blue-600" />
                <SummaryCard icon="bath" value={property.properties.bathrooms.toString()} label="Bathrooms" color="bg-green-100 text-green-600" />
                <SummaryCard icon="home" value={`${property.properties.squareFootage} Sq Ft`} label="Sq Ft" color="bg-purple-100 text-purple-600" />
                <SummaryCard icon="car" value={(property.properties.parkingSpaces ?? 0).toString()} label="Parking" color="bg-orange-100 text-orange-600" />
              </div>
            </div>

            {/* Description & Features */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">About This Property</h3>
              <p className="text-gray-700 leading-relaxed">{property.properties.description}</p>
            </div>

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
              <p className="text-sm text-gray-600 mt-2">💰 <strong>Total Estimate:</strong> ${rent + 130}–${rent + 310}/month</p>
            </div>

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
                <p>⚡ Quick Response: We typically respond within <strong>1 hour</strong></p>
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
    car: <Car className="w-6 h-6" />
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