'use client';

import { useState, useCallback, useEffect } from 'react';
import { HiSearch, HiLocationMarker, HiHome, HiCheck } from 'react-icons/hi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Property {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  squareFootage?: number;
  landlordId?: string;
  landlordName?: string;
  landlordLastName?: string;
  landlordEmail?: string;
  fullAddress: string;
  displayName: string;
  landlordFullName: string;
  matchScore?: number;
  matchReasons?: string[];
  isExactMatch?: boolean;
  isGoodMatch?: boolean;
}

interface PropertySelectorProps {
  onPropertySelected: (property: Property | null) => void;
  selectedProperty?: Property | null;
  autoMatchData?: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
  };
}

export default function PropertySelector({ 
  onPropertySelected, 
  selectedProperty,
  autoMatchData 
}: PropertySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [matchResults, setMatchResults] = useState<Property[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState<'search' | 'match'>('search');

  // Auto-match properties when autoMatchData is provided
  useEffect(() => {
    if (autoMatchData && !selectedProperty) {
      handleAutoMatch();
    }
  }, [autoMatchData]);

  const handleAutoMatch = async () => {
    if (!autoMatchData) return;
    
    setIsMatching(true);
    setSearchType('match');
    
    try {
      const response = await fetch('/api/properties/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoMatchData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMatchResults(data.matches || []);
        setShowResults(data.matches?.length > 0);
        
        // If there's a confident match, auto-select it
        if (data.isConfidentMatch && data.bestMatch) {
          onPropertySelected(data.bestMatch);
        }
      }
    } catch (error) {
      console.error('Error matching properties:', error);
    } finally {
      setIsMatching(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setSearchType('search');
    
    try {
      const response = await fetch(`/api/properties/search?q=${encodeURIComponent(searchQuery.trim())}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.properties || []);
        setShowResults(data.properties?.length > 0);
      }
    } catch (error) {
      console.error('Error searching properties:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handlePropertySelect = (property: Property) => {
    onPropertySelected(property);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleClearSelection = () => {
    onPropertySelected(null);
    setSearchQuery('');
    setShowResults(false);
  };

  const currentResults = searchType === 'match' ? matchResults : searchResults;
  const isLoading = searchType === 'match' ? isMatching : isSearching;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Select Original Property
        </h3>
        <p className="text-sm text-gray-600">
          Choose the property you want to sublet to notify the landlord
        </p>
      </div>

      {/* Selected Property Display */}
      {selectedProperty && (
        <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <HiCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {selectedProperty.displayName}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedProperty.bedrooms} bed, {selectedProperty.bathrooms} bath {selectedProperty.propertyType}
                </p>
                {selectedProperty.landlordFullName && (
                  <p className="text-xs text-gray-500">
                    Landlord: {selectedProperty.landlordFullName}
                  </p>
                )}
                {selectedProperty.matchScore && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {selectedProperty.matchScore}% match
                    </span>
                    {selectedProperty.matchReasons && selectedProperty.matchReasons.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedProperty.matchReasons.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="text-gray-500 hover:text-gray-700"
            >
              Change
            </Button>
          </div>
        </div>
      )}

      {/* Search Input */}
      {!selectedProperty && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search by address, city, or zip code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      )}

      {/* Auto-match Results */}
      {searchType === 'match' && matchResults.length > 0 && !selectedProperty && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Found {matchResults.length} matching propert{matchResults.length === 1 ? 'y' : 'ies'}
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Based on the property details you entered
          </p>
        </div>
      )}

      {/* Results List */}
      {showResults && currentResults.length > 0 && !selectedProperty && (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-80 overflow-y-auto">
          {currentResults.map((property) => (
            <div
              key={property.id}
              onClick={() => handlePropertySelect(property)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <HiHome className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {property.displayName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {property.bedrooms} bed, {property.bathrooms} bath {property.propertyType}
                      {property.squareFootage && ` • ${property.squareFootage} sq ft`}
                    </p>
                    {property.landlordFullName && (
                      <p className="text-xs text-gray-500">
                        Landlord: {property.landlordFullName}
                      </p>
                    )}
                    {property.matchScore && property.matchScore > 0 && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          property.isExactMatch 
                            ? 'bg-green-100 text-green-800'
                            : property.isGoodMatch
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {property.matchScore}% match
                        </span>
                        {property.matchReasons && property.matchReasons.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {property.matchReasons.slice(0, 2).join(', ')}
                            {property.matchReasons.length > 2 && '...'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <HiLocationMarker className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && currentResults.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <HiHome className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">
            {searchType === 'match' 
              ? 'No matching properties found. You can still create the sublisting without linking it to an original property.'
              : 'No properties found. Try a different search term.'
            }
          </p>
        </div>
      )}

      {/* Skip Option */}
      {!selectedProperty && (
        <div className="pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={() => onPropertySelected(null)}
            className="w-full text-gray-600 hover:text-gray-800"
          >
            Skip - Create subletting without linking to original property
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            The original landlord won't be notified
          </p>
        </div>
      )}
    </div>
  );
}
