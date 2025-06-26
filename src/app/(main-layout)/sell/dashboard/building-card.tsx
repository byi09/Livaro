import Spinner from '@/src/components/ui/Spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Building, MapPin } from 'lucide-react'

interface ApartmentBuilding {
  id: string
  building_name: string
  building_number?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  total_units: number
}

interface BuildingCardProps {
  building: ApartmentBuilding
  onBuildingClick: (building: ApartmentBuilding) => void
  onEditClick: (e: React.MouseEvent) => void
  onDeleteClick: (e: React.MouseEvent) => void
  isLoading: boolean
  formatAddress: (building: ApartmentBuilding) => string
}

export default function BuildingCard({
  building,
  onBuildingClick,
  onEditClick,
  onDeleteClick,
  isLoading,
  formatAddress,
}: BuildingCardProps) {
  return (
    <Card
      className={`hover:shadow-lg transition-shadow cursor-pointer ${
        isLoading ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
      onClick={() => onBuildingClick(building)}
    >
      {/* Building Image Placeholder */}
      <div className="w-full h-48 bg-gradient-to-br from-green-100 to-green-200 rounded-t-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <Building className="h-8 w-8 text-white" />
          </div>
          <p className="text-green-700 text-sm font-medium">
            {building.total_units} Units
          </p>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Status Badge and Action Buttons */}
        <div className="flex justify-between items-start mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Building
          </span>

          <div className="flex space-x-1">
            <Button
              onClick={onEditClick}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              title="Edit building details"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              onClick={onDeleteClick}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
              title="Delete building"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Building Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
          {building.building_name}
          {building.building_number && ` #${building.building_number}`}
        </h3>

        {/* Address */}
        <div className="flex items-start space-x-2 mb-3">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground line-clamp-2">
            {formatAddress(building)}
          </p>
        </div>

        {/* Building Details */}
        <div className="flex items-center text-sm text-muted-foreground mb-3 space-x-4">
          <div className="flex items-center space-x-1">
            <Building className="h-4 w-4" />
            <span>
              {building.total_units}{' '}
              {building.total_units === 1 ? 'Unit' : 'Units'}
            </span>
          </div>
        </div>

        {/* Action Text */}
        <div className="flex items-center text-xs text-blue-600 font-medium">
          {isLoading && (
            <Spinner size={12} colorClass="text-blue-600" className="mr-2" />
          )}
          {isLoading ? 'Loading...' : 'Click to manage building'}
        </div>
      </CardContent>
    </Card>
  )
}
