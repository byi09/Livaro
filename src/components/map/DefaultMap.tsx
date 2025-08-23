'use client';

import Map from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useMemo } from "react";
import { useGeolocationContext } from "@/src/contexts/GeolocationContext";
import { useSearchParams } from "next/navigation";

export default function DefaultMap({
  children
}: {
  children?: React.ReactNode;
}) {
  const mapRef = useRef<any>(null);
  const { coords } = useGeolocationContext();
  const searchParams = useSearchParams();

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN)
    throw new Error('Mapbox access token is not defined.');

  // Determine initial view state based on user data
  const initialViewState = useMemo(() => {
    // Priority 1: URL search params (from user search)
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const zoom = searchParams.get("zoom");
    
    if (lat && lng) {
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        zoom: zoom ? parseFloat(zoom) : 13
      };
    }
    
    // Priority 2: User's geolocation
    if (coords) {
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        zoom: 13
      };
    }
    
    // Priority 3: Default fallback (San Francisco Bay Area)
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      zoom: 13
    };
  }, [searchParams, coords]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        // Force map to resize when container size changes
        mapRef.current.getMap().resize();
      }
    };

    // Listen for window resize events
    window.addEventListener('resize', handleResize);
    
    // Create a ResizeObserver to watch for container size changes
    const container = mapRef.current?.getContainer();
    let resizeObserver: ResizeObserver | null = null;
    
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container.parentElement || container);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: '100%', height: '100%' }}
      initialViewState={initialViewState}
      maxZoom={20}
      minZoom={3}
    >
      {children}
    </Map>
  )
}
