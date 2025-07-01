'use client';

import { useMapContext } from "@/src/contexts/MapContext";
import DefaultMap from "@/src/components/map/DefaultMap";
import MapCatalog from "@/src/components/map/MapCatalog";
import MapControls from "@/src/components/map/MapControls";
import MapMarkers from "@/src/components/map/MapMarkers";
import MapCatalogComingSoon from "@/src/components/map/MapCatalogComingSoon";
import PropertyDetailModal from "@/src/components/map/PropertyDetailModal";
import { ENABLE_MAP } from "@/lib/config";
import { PropertyListing } from "@/lib/types";

export default function MapPageClient() {
  const { selectedProperty, setSelectedProperty } = useMapContext();

  const handleCloseModal = () => {
    setSelectedProperty(null);
  };

  const handleContact = async (property: PropertyListing, method: 'phone' | 'email' | 'message') => {
    console.log(`Contacting about property ${property.properties.id} via ${method}`);
    
    try {
      // Get landlord information
      const response = await fetch(`/api/properties/${property.properties.id}/landlord`);
      const landlordData = await response.json();
      
      if (!landlordData) {
        alert('Unable to get landlord contact information');
        return;
      }
      
      switch (method) {
        case 'phone':
          const phoneNumber = landlordData.businessPhone || landlordData.phoneNumber;
          if (phoneNumber) {
            window.open(`tel:${phoneNumber}`, '_self');
          } else {
            alert('Phone number not available for this landlord');
          }
          break;
          
        case 'email':
          const email = landlordData.businessEmail || landlordData.userEmail;
          if (email) {
            const subject = encodeURIComponent(`Inquiry about ${property.properties.addressLine1}`);
            const body = encodeURIComponent(`Hi, I'm interested in learning more about your property at ${property.properties.addressLine1}. Please let me know if it's still available.`);
            window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
          } else {
            alert('Email not available for this landlord');
          }
          break;
          
        case 'message':
          // Create a conversation with the landlord
          const conversationResponse = await fetch('/api/messaging/conversation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversation_type: 'direct',
              participant_ids: [landlordData.userId],
              property_id: property.properties.id,
              content: `Hi! I'm interested in your property at ${property.properties.addressLine1}. Is it still available?`
            }),
          });
          
          if (conversationResponse.ok) {
            const conversationData = await conversationResponse.json();
            // Redirect to messaging page or show success message
            alert('Message sent successfully! Check your messages.');
          } else {
            alert('Failed to send message. Please try again.');
          }
          break;
      }
    } catch (error) {
      console.error('Error contacting landlord:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <div className="flex w-full flex-1 min-h-0">
        <div className="flex-1">
          <DefaultMap>
            <MapControls />
            <MapMarkers />
          </DefaultMap>
        </div>
        {/* TODO: get rid of the coming soon component */}
        {ENABLE_MAP ? <MapCatalog /> : <MapCatalogComingSoon />}
      </div>
      
      <PropertyDetailModal
        property={selectedProperty}
        onClose={handleCloseModal}
        onContact={handleContact}
      />
    </>
  );
} 