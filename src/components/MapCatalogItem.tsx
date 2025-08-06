'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState, memo } from 'react'
import { PropertyListing } from '@/lib/types'
import {
  capitalizeFirstLetter,
  formatPrice,
  trimZeros,
} from '@/utils/formatters'
import Image from 'next/image'
import { useMapContext } from '@/src/contexts/MapContext'
import { useToast } from '@/src/components/ui/Toast'
import { usePropertyModal } from '@/src/contexts/MapContext'

// Initialize Supabase Client using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const useSafeMapContext = () => {
  try {
    return useMapContext()
  } catch {
    return null
  }
}

function MapCatalogItem({
  item,
  initialLiked = false,
  onUnlike,
}: {
  item: PropertyListing
  initialLiked?: boolean
  onUnlike?: (propertyId: string) => void
}) {
  const mapContext = useSafeMapContext()
  const { success, error } = useToast()
  const { setSelectedProperty } = usePropertyModal()
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // Fetch Random Image from Supabase Storage with optimization
  useEffect(() => {
    let isCancelled = false;
    
    const fetchRandomImage = async () => {
      try {
        // Add a small delay to prevent excessive API calls during rapid scrolling
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (isCancelled) return;
        
        const { data, error } = await supabase
          .storage
          .from('property-images')
          .list('listings/ac3c6957-b8c4-4698-a34e-90317f407a66', {
            limit: 20, // Reduced limit for better performance
          })

        if (error || isCancelled) {
          console.error('Error fetching images:', error)
          return
        }

        if (data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length)
          const fileName = data[randomIndex].name

          const { data: publicUrlData } = supabase
            .storage
            .from('property-images')
            .getPublicUrl(`listings/ac3c6957-b8c4-4698-a34e-90317f407a66/${fileName}`)

          if (publicUrlData?.publicUrl && !isCancelled) {
            setImageUrl(publicUrlData.publicUrl)
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error in fetchRandomImage:', error);
        }
      }
    }

    fetchRandomImage()
    
    return () => {
      isCancelled = true;
    }
  }, [])

  useEffect(() => {
    setIsLiked(initialLiked)
  }, [initialLiked])

  const handleClick = () => {
    setSelectedProperty(item)
    if (mapContext) {
      mapContext.setSelectedProperty(item)
    }
  }

  const toggleLike = async (propertyId: string) => {
    try {
      const method = isLiked ? 'DELETE' : 'POST'

      const res = await fetch('/api/properties/like', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data?.message || 'Failed to toggle like')

      if (method === 'POST') {
        success('Property liked!')
        setIsLiked(true)
      } else {
        success('Removed from liked properties.')
        setIsLiked(false)
        onUnlike?.(propertyId)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      error('Failed to update like status', errorMessage)
      console.error(err)
    }
  }

  const isSelected =
    mapContext?.selectedProperty?.properties.id === item.properties.id

  return (
    <div
      className={`rounded-md shadow-md w-full overflow-hidden cursor-pointer hover:shadow-xl border transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
          : 'border-gray-200'
      }`}
      onClick={handleClick}
    >
      <Image
        src={imageUrl || '/hero-bg.jpg'} // Load Supabase image or fallback
        alt={item.property_listings.listingTitle || 'Property Image'}
        className="w-full h-40 object-cover"
        width={400}
        height={200}
      />
      <div className="p-2">
        <div className="flex justify-between items-start">
          <h1 className="text-xl font-bold">
            {formatPrice(parseFloat(item.property_listings.monthlyRent))}/mo
          </h1>
          <button
            onClick={e => {
              e.stopPropagation()
              toggleLike(item.properties.id)
            }}
            className={`text-2xl transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
            }`}
            title={isLiked ? 'Unlike Property' : 'Like Property'}
          >
            {isLiked ? '❤️' : '♡'}
          </button>
        </div>
        <p className="line-clamp-1 text-sm">
          <b>
            {item.properties.bedrooms > 0
              ? `${item.properties.bedrooms}bd`
              : 'Studio'}
          </b>{' '}
          | <b>{trimZeros(item.properties.bathrooms)}</b>ba |{' '}
          <b>
            {item.properties.squareFootage && item.properties.squareFootage > 0
              ? item.properties.squareFootage
              : 'N/A'}
          </b>
          sqft - {capitalizeFirstLetter(item.properties.propertyType)} for rent
        </p>
        <p className="line-clamp-1 text-sm">
          {item.property_listings.listingTitle &&
            `${item.property_listings.listingTitle} | `} 
          {item.properties.addressLine1}, {item.properties.city},{' '}
          {item.properties.state} {item.properties.zipCode}
        </p>
      </div>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(MapCatalogItem, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.item.properties.id === nextProps.item.properties.id &&
    prevProps.initialLiked === nextProps.initialLiked &&
    prevProps.item.property_listings.monthlyRent === nextProps.item.property_listings.monthlyRent
  );
});
