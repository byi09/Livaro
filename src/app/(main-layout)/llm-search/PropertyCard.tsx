import { PropertyListing } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PropertyCardProps {
  listing: PropertyListing;
  index: number;
}

export default function PropertyCard({ listing, index }: PropertyCardProps) {
  const { property } = listing;

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="text-lg">
          {listing.listingTitle ||
            `${property.propertyType} Listing #${index + 1}`}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {property.propertyType}
          </Badge>
          <Badge variant="outline">${listing.monthlyRent}/month</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-1">
              Address
            </h4>
            <p className="text-sm">
              {property.addressLine1}
              {property.addressLine2 && <br />}
              {property.addressLine2}
              <br />
              {property.city}, {property.state} {property.zipCode}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-1">
              Details
            </h4>
            <div className="text-sm space-y-1">
              <p>
                🛏️ {property.bedrooms} bedroom
                {property.bedrooms !== 1 ? "s" : ""}
              </p>
              <p>
                🚿 {property.bathrooms} bathroom
                {property.bathrooms !== "1" ? "s" : ""}
              </p>
              {property.squareFootage && (
                <p>📐 {property.squareFootage.toLocaleString()} sq ft</p>
              )}
              <p>
                🚗 {property.parkingSpaces} parking space
                {property.parkingSpaces !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {listing.securityDeposit && (
          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-1">
              Security Deposit
            </h4>
            <p className="text-sm">${listing.securityDeposit}</p>
          </div>
        )}

        {listing.availableDate && (
          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-1">
              Available Date
            </h4>
            <p className="text-sm">
              {new Date(listing.availableDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {listing.listingDescription && (
          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-1">
              Description
            </h4>
            <p className="text-sm text-gray-800">
              {listing.listingDescription.length > 200
                ? `${listing.listingDescription.substring(0, 200)}...`
                : listing.listingDescription}
            </p>
          </div>
        )}

        {listing.virtualTourUrl && (
          <div>
            <a
              href={listing.virtualTourUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              🎥 View Virtual Tour
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
