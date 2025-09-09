'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, User, Building } from 'lucide-react';


interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'landlord' | 'renter' | 'agent';
  businessName?: string;
}

interface Property {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
}

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateConversation: (data: {
    participantIds: string[];
    propertyId?: string;
    conversationType: 'direct' | 'group';
    title?: string;
  }) => void;
  onSearchUsers: (query: string) => Promise<User[]>;
  onSearchProperties: (query: string) => Promise<Property[]>;
  currentUserId: string;
}

export default function CreateConversationModal({
  isOpen,
  onClose,
  onCreateConversation,
  onSearchUsers,
  onSearchProperties,
  currentUserId
}: CreateConversationModalProps) {
  const [step, setStep] = useState<'users' | 'property' | 'details'>('users');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [conversationType, setConversationType] = useState<'direct' | 'group'>('direct');
  const [groupTitle, setGroupTitle] = useState('');
  
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [propertySearchQuery, setPropertySearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [propertySearchResults, setPropertySearchResults] = useState<Property[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isSearchingProperties, setIsSearchingProperties] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setStep('users');
      setSelectedUsers([]);
      setSelectedProperty(null);
      setConversationType('direct');
      setGroupTitle('');
      setUserSearchQuery('');
      setPropertySearchQuery('');
      setUserSearchResults([]);
      setPropertySearchResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchUsers = async () => {
      if (userSearchQuery.trim().length > 1) {
        setIsSearchingUsers(true);
        try {
          const results = await onSearchUsers(userSearchQuery);
          setUserSearchResults(results.filter(user => user.id !== currentUserId));
        } catch (error) {
          console.error('Error searching users:', error);
          setUserSearchResults([]);
        } finally {
          setIsSearchingUsers(false);
        }
      } else {
        setUserSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [userSearchQuery, onSearchUsers, currentUserId]);

  useEffect(() => {
    const searchProperties = async () => {
      if (propertySearchQuery.trim().length > 1) {
        setIsSearchingProperties(true);
        try {
          const results = await onSearchProperties(propertySearchQuery);
          setPropertySearchResults(results);
        } catch (error) {
          console.error('Error searching properties:', error);
          setPropertySearchResults([]);
        } finally {
          setIsSearchingProperties(false);
        }
      } else {
        setPropertySearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchProperties, 300);
    return () => clearTimeout(timeoutId);
  }, [propertySearchQuery, onSearchProperties]);

  const handleUserSelect = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      const newSelectedUsers = [...selectedUsers, user];
      setSelectedUsers(newSelectedUsers);
      
      // Auto-set conversation type based on number of participants
      if (newSelectedUsers.length === 1) {
        setConversationType('direct');
      } else {
        setConversationType('group');
      }
    }
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleUserRemove = (userId: string) => {
    const newSelectedUsers = selectedUsers.filter(u => u.id !== userId);
    setSelectedUsers(newSelectedUsers);
    
    // Update conversation type
    if (newSelectedUsers.length <= 1) {
      setConversationType('direct');
    }
  };

  const handleNext = () => {
    if (step === 'users' && selectedUsers.length > 0) {
      setStep('property');
    } else if (step === 'property') {
      if (conversationType === 'group') {
        setStep('details');
      } else {
        handleCreate();
      }
    }
  };

  const handleSkipProperty = () => {
    if (conversationType === 'group') {
      setStep('details');
    } else {
      handleCreate();
    }
  };

  const handleCreate = () => {
    if (selectedUsers.length === 0) return;

    onCreateConversation({
      participantIds: selectedUsers.map(u => u.id),
      propertyId: selectedProperty?.id,
      conversationType,
      title: conversationType === 'group' ? groupTitle : undefined
    });

    onClose();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getRoleDisplay = (role: string, businessName?: string) => {
    switch (role) {
      case 'landlord':
        return businessName || 'Landlord';
      case 'agent':
        return 'Leasing Agent';
      case 'renter':
        return 'Renter';
      default:
        return 'User';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'users' && 'Select People'}
            {step === 'property' && 'Select Property (Optional)'}
            {step === 'details' && 'Group Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'users' && (
            <div className="space-y-4">
              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Selected:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{user.firstName} {user.lastName}</span>
                        <button
                          onClick={() => handleUserRemove(user.id)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search for people..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* User Search Results */}
              {isSearchingUsers && (
                <div className="text-center py-4">
                  <div className="animate-pulse text-gray-600 text-sm">...</div>
                </div>
              )}

              {userSearchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userSearchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-blue-600">
                          {getRoleDisplay(user.role, user.businessName)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'property' && (
            <div className="space-y-4">
              {/* Selected Property */}
              {selectedProperty && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{selectedProperty.addressLine1}</p>
                      <p className="text-sm text-green-700">
                        {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedProperty(null)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Property Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={propertySearchQuery}
                  onChange={(e) => setPropertySearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Property Search Results */}
              {isSearchingProperties && (
                <div className="text-center py-4">
                  <div className="animate-pulse text-gray-600 text-sm">...</div>
                </div>
              )}

              {propertySearchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {propertySearchResults.map((property) => (
                    <div
                      key={property.id}
                      onClick={() => {
                        setSelectedProperty(property);
                        setPropertySearchQuery('');
                        setPropertySearchResults([]);
                      }}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <Building className="w-8 h-8 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{property.addressLine1}</p>
                        <p className="text-sm text-gray-600">
                          {property.city}, {property.state} {property.zipCode}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <div>
            {step === 'property' && (
              <button
                onClick={handleSkipProperty}
                className="text-gray-600 hover:text-gray-800"
              >
                Skip
              </button>
            )}
          </div>
          
          <div className="space-x-3">
            {step !== 'users' && (
              <button
                onClick={() => {
                  if (step === 'details') setStep('property');
                  else if (step === 'property') setStep('users');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
            )}
            
            <button
              onClick={step === 'details' ? handleCreate : handleNext}
              disabled={
                (step === 'users' && selectedUsers.length === 0) ||
                (step === 'details' && conversationType === 'group' && !groupTitle.trim())
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {step === 'details' ? 'Create' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 