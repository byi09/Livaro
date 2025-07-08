import Spinner from '@/src/components/ui/Spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Bed, Bath, Square } from 'lucide-react'

interface PropertyListing {
  id: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  property_type: string
  bedrooms: number
  bathrooms: number
  listing_title?: string
  monthly_rent?: number
  listing_status?: string
  listing_created?: string
  square_footage?: number
}

interface ListingCardProps {
  property: PropertyListing
  onPropertyClick: (property: PropertyListing) => void
  onEditClick: (e: React.MouseEvent) => void
  onDeleteClick: (e: React.MouseEvent) => void
  isLoading: boolean
  formatAddress: (property: PropertyListing) => string
  formatPrice: (price?: number) => string
  getStatusBadge: (status?: string) => React.ReactNode
  getActionText: (property: PropertyListing) => string
}

export default function ListingCard({
  property,
  onPropertyClick,
  onEditClick,
  onDeleteClick,
  isLoading,
  formatAddress,
  formatPrice,
  getStatusBadge,
  getActionText,
}: ListingCardProps) {
  return (
    <Card
      className={`hover:shadow-lg transition-shadow cursor-pointer ${
        isLoading ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
      onClick={() => onPropertyClick(property)}
    >
      {/* Property Image Placeholder */}
      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-lg">
              {property.bedrooms}BR
            </span>
          </div>
          <p className="text-blue-700 text-sm font-medium">
            {property.property_type}
          </p>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Status Badge and Action Buttons */}
        <div className="flex justify-between items-start mb-2">
          {getStatusBadge(property.listing_status)}

          <div className="flex space-x-1">
            <Button
              onClick={onEditClick}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              title="Edit property details"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              onClick={onDeleteClick}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
              title="Delete property"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Property Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
          {property.listing_title || formatAddress(property)}
        </h3>

        {/* Address */}
        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
          {formatAddress(property)}
        </p>

        {/* Property Details */}
        <div className="flex items-center text-sm text-muted-foreground mb-3 space-x-4">
          <div className="flex items-center space-x-1">
            <Bed className="h-4 w-4" />
            <span>{property.bedrooms}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Bath className="h-4 w-4" />
            <span>{property.bathrooms}</span>
          </div>
          {property.square_footage && (
            <div className="flex items-center space-x-1">
              <Square className="h-4 w-4" />
              <span>{property.square_footage} sq ft</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-bold text-foreground">
            {formatPrice(property.monthly_rent)}
            <span className="text-sm font-normal text-muted-foreground">
              /month
            </span>
          </span>
          {property.listing_created && (
            <span className="text-xs text-muted-foreground">
              Listed {new Date(property.listing_created).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Action Text */}
        <div className="flex items-center text-xs text-blue-600 font-medium">
          {isLoading && (
            <Spinner size={12} colorClass="text-blue-600" className="mr-2" />
          )}
          {isLoading ? 'Loading...' : getActionText(property)}
        </div>
      </CardContent>
    </Card>
  )
}
