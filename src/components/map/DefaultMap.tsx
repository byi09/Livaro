'use client';

import Map from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMemo } from "react";

export default function DefaultMap({
  children
}: {
  children?: React.ReactNode;
}) {
  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN)
    throw new Error('Mapbox access token is not defined.');

  // Memoize map props for better performance
  const mapProps = useMemo(() => ({
    mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    mapStyle: "mapbox://styles/mapbox/streets-v12",
    style: { width: '100%', height: '100%' },
    initialViewState: { 
      latitude: 38.795521, 
      longitude: -122.305651, 
      zoom: 10 
    },
    maxZoom: 20,
    minZoom: 3,
    // Performance optimizations
    reuseMaps: true,
    preserveDrawingBuffer: false,
    antialias: false, // Disable for better performance on lower-end devices
    optimizeForTerrain: true
  }), []);

  return (
    <Map {...mapProps}>
      {children}
    </Map>
  )
}
