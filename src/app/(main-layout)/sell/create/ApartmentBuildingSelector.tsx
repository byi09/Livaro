'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ChevronDown, Building2, Plus } from 'lucide-react'

interface ApartmentBuilding {
  id: string
  building_name: string
  address_line_1: string
  city: string
  state: string
}

interface ApartmentBuildingSelectorProps {
  value: string
  onChange: (buildingId: string) => void
  disabled?: boolean
  landlordId: string | null
}

export default function ApartmentBuildingSelector({
  value,
  onChange,
  disabled = false,
  landlordId,
}: ApartmentBuildingSelectorProps) {
  const [buildings, setBuildings] = useState<ApartmentBuilding[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!landlordId) {
      setLoading(false)
      return
    }

    const fetchBuildings = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('apartment_buildings')
          .select('id, building_name, address_line_1, city, state')
          .eq('landlord_id', landlordId)
          .order('building_name')

        if (error) {
          console.error('Error fetching apartment buildings:', error)
        } else {
          setBuildings(data || [])
        }
      } catch (error) {
        console.error('Error fetching apartment buildings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBuildings()
  }, [landlordId])

  const selectedBuilding = buildings.find(building => building.id === value)

  if (loading) {
    return (
      <div className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md bg-gray-50">
        <div className="flex items-center">
          <Building2 className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-gray-500">Loading buildings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md text-left ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed'
            : 'bg-blue-50 hover:bg-blue-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-gray-600" />
            <span
              className={selectedBuilding ? 'text-gray-900' : 'text-gray-500'}
            >
              {selectedBuilding
                ? `${selectedBuilding.building_name} - ${selectedBuilding.address_line_1}, ${selectedBuilding.city}, ${selectedBuilding.state}`
                : buildings.length > 0
                ? 'Select an apartment building (optional)'
                : 'No apartment buildings found'}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {buildings.length === 0 ? (
            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">
                  No apartment buildings found
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    window.open('/sell/create/apartment-building', '_blank')
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Building
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setIsOpen(false)
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center"
              >
                <span className="text-gray-500">
                  No building (standalone unit)
                </span>
              </button>

              {buildings.map(building => (
                <button
                  key={building.id}
                  type="button"
                  onClick={() => {
                    onChange(building.id)
                    setIsOpen(false)
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
                    value === building.id ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-gray-600" />
                    <div>
                      <div className="font-medium">
                        {building.building_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {building.address_line_1}, {building.city},{' '}
                        {building.state}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              <div className="border-t border-gray-200 px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    window.open('/sell/create/apartment-building', '_blank')
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create New Building
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}
