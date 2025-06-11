'use client';

import { useCallback, useEffect, useState } from "react";
import { useMap } from "react-map-gl/mapbox";
import { useMapContext } from "../../contexts/MapContext";
import { MapEvent } from "mapbox-gl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGeolocationContext } from "@/src/contexts/GeolocationContext";

export default function MapControls() {
  const { current: map } = useMap();
  if (!map)
    throw new Error('Map instance is not available. MapControls must be used within a Map component.');

  const { setFilterOptions, setReady } = useMapContext();
  const { coords } = useGeolocationContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [centerLoaded, setCenterLoaded] = useState(false);

  // -----------------------
  // |   Helper functions  |
  // -----------------------

  // helper function to update bounds based on map events
  const updateBounds = useCallback((e: MapEvent) => {
    const bounds = e.target.getBounds();
    if (!bounds) return;

    // Update filter options with the new bounds
    setFilterOptions(prev => ({
      ...prev,
      swBounds: bounds.getSouthWest(),
      neBounds: bounds.getNorthEast()
    }));
  }, [setFilterOptions]);

  // helper function to set the initial map center and zoom
  const initializeMapState = useCallback(async () => {
    // load initial map state from query params
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoom = searchParams.get('zoom');

    if (zoom) {
      const initialZoom = parseFloat(zoom);
      map.setZoom(initialZoom);
    }

    if (lat && lng) {
      const initialLat = parseFloat(lat);
      const initialLng = parseFloat(lng);
      map.setCenter([initialLng, initialLat]);
      setCenterLoaded(true);
      return;
    }

    // if no lat/lng in query params, use collected geolocation
    const c = await coords;
    if (c) {
      map.setCenter([c.lng, c.lat]);
      setCenterLoaded(true);
    }
  }, [map, searchParams, coords]);

  // -------------------------
  // |   Map event handlers  |
  // -------------------------

  const onMoveEnd = useCallback((e: MapEvent) => {
    // update bounds when the map is moved
    updateBounds(e);

    // update query params to store map state
    const center = e.target.getCenter();
    const zoom = e.target.getZoom();
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('lat', center.lat.toFixed(6));
    newParams.set('lng', center.lng.toFixed(6));
    newParams.set('zoom', zoom.toFixed(2));
    router.replace(`${pathname}?${newParams.toString()}`);
  }, [pathname, router, searchParams, updateBounds]);

  // -------------------------------------------
  // |   Effect hooks for map initialization   |
  // -------------------------------------------

  // set initial map state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (centerLoaded) return; // prevent multiple initializations
    setCenterLoaded(true);
    initializeMapState();
  }, [centerLoaded, initializeMapState]);

  // add event listeners on map load (and set initial bounds)
  useEffect(() => {
    map.once('load', e => {
      // update bounds
      updateBounds(e);

      // update bounds on moveend
      // and update query params to store map state
      e.target.on('moveend', onMoveEnd);

      // mark map as ready
      setReady(true);
    });
  }, [map, updateBounds, setReady, onMoveEnd]);

  return null;
}
