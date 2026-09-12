'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Map, GeoJson, Draggable } from 'pigeon-maps';
import { area } from '@turf/area';
import { polygon as turfPolygon } from '@turf/helpers';
import { 
  Undo2, 
  Trash2, 
  Check, 
  Maximize2, 
  Layers, 
  MapPin, 
  MousePointerClick,
  Plus,
  Minus,
  Crosshair
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MapDrawProps {
  onChange?: (geojson: string) => void;
  initialGeojson?: string;
  readOnly?: boolean;
}

// Zero-config Tile Providers
const SATELLITE_PROVIDER = (x: number, y: number, z: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

const STREET_PROVIDER = (x: number, y: number, z: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

export function MapDraw({ onChange, initialGeojson, readOnly = false }: MapDrawProps) {
  const [center, setCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [zoom, setZoom] = useState<number>(5);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  const [stats, setStats] = useState({ points: 0, areaHa: 0 });

  // Geolocation function with success & warning toasts
  const locateUser = useCallback((showToast = true) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (showToast) toast.warning('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCenter([latitude, longitude]);
        setZoom(15);
        if (showToast) toast.success('Map centered to your current location');
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        if (showToast) {
          toast.warning('Could not access current location. Showing default map view.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // Helper to calculate area and emit GeoJSON
  const recalculateStats = useCallback((pts: [number, number][], completed: boolean) => {
    if (pts.length < 3) {
      setStats({ points: pts.length, areaHa: 0 });
      if (!readOnly) onChange?.('');
      return;
    }

    try {
      // GeoJSON expects [lng, lat]
      const closedCoords = [...pts, pts[0]].map(([lat, lng]) => [lng, lat]);
      const poly = turfPolygon([closedCoords]);
      const areaSqMeters = area(poly);
      const areaHa = areaSqMeters / 10000;

      setStats({
        points: pts.length,
        areaHa: Math.round(areaHa * 10000) / 10000,
      });

      if (completed && !readOnly) {
        const featureCollection = {
          type: 'FeatureCollection',
          features: [poly],
        };
        onChange?.(JSON.stringify(featureCollection));
      }
    } catch (e) {
      console.error('Error calculating Turf area:', e);
    }
  }, [onChange, readOnly]);

  // Load initial GeoJSON or request user location on mount
  useEffect(() => {
    if (initialGeojson) {
      try {
        const parsed = JSON.parse(initialGeojson);
        let coords: [number, number][] = [];

        if (parsed.type === 'FeatureCollection' && parsed.features?.[0]?.geometry?.coordinates) {
          coords = parsed.features[0].geometry.coordinates[0];
        } else if (parsed.type === 'Feature' && parsed.geometry?.coordinates) {
          coords = parsed.geometry.coordinates[0];
        } else if (parsed.type === 'Polygon' && parsed.coordinates) {
          coords = parsed.coordinates[0];
        }

        if (coords.length > 0) {
          // Drop duplicated closing vertex and convert [lng, lat] to [lat, lng]
          const cleanPts = coords.slice(0, coords.length - 1).map(([lng, lat]) => [lat, lng] as [number, number]);
          setPoints(cleanPts);
          setIsCompleted(true);

          // Auto center and zoom on polygon bounds
          if (cleanPts.length > 0) {
            let minLat = cleanPts[0][0], maxLat = cleanPts[0][0];
            let minLng = cleanPts[0][1], maxLng = cleanPts[0][1];
            cleanPts.forEach(([lat, lng]) => {
              if (lat < minLat) minLat = lat;
              if (lat > maxLat) maxLat = lat;
              if (lng < minLng) minLng = lng;
              if (lng > maxLng) maxLng = lng;
            });
            setCenter([(minLat + maxLat) / 2, (minLng + maxLng) / 2]);
            setZoom(15);
          }
          return;
        }
      } catch (e) {
        console.error('Failed to parse initial GeoJSON in MapDraw:', e);
      }
    }

    // Default to current user location if no initial polygon is present
    if (!readOnly) {
      locateUser(true);
    }
  }, [initialGeojson, readOnly, locateUser]);

  // Handle map click to add vertex
  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    if (readOnly || isCompleted) return;
    const newPoints = [...points, latLng];
    setPoints(newPoints);
    recalculateStats(newPoints, false);
  };

  // Handle point dragging
  const handlePointDrag = (index: number, newLatLng: [number, number]) => {
    if (readOnly) return;
    const updated = [...points];
    updated[index] = newLatLng;
    setPoints(updated);
    recalculateStats(updated, isCompleted);
  };

  const handleUndo = () => {
    if (points.length === 0) return;
    const updated = points.slice(0, -1);
    setPoints(updated);
    setIsCompleted(false);
    recalculateStats(updated, false);
  };

  const handleClear = () => {
    setPoints([]);
    setIsCompleted(false);
    setStats({ points: 0, areaHa: 0 });
    onChange?.('');
  };

  const handleFinish = () => {
    if (points.length >= 3) {
      setIsCompleted(true);
      recalculateStats(points, true);
    }
  };

  const handleFitBounds = () => {
    if (points.length === 0) return;
    let minLat = points[0][0], maxLat = points[0][0];
    let minLng = points[0][1], maxLng = points[0][1];
    points.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });
    setCenter([(minLat + maxLat) / 2, (minLng + maxLng) / 2]);
    const latDiff = Math.max(maxLat - minLat, 0.002);
    const lngDiff = Math.max(maxLng - minLng, 0.002);
    const calculatedZoom = Math.floor(Math.min(Math.log2(360 / latDiff), Math.log2(360 / lngDiff))) - 1;
    setZoom(Math.min(Math.max(calculatedZoom, 4), 16));
  };

  // Construct GeoJSON object for Pigeon Maps GeoJson layer
  const geojsonData = useMemo(() => {
    if (points.length < 2) return null;
    if (points.length === 2) {
      return {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: points.map(([lat, lng]) => [lng, lat]),
            },
          },
        ],
      };
    }
    const coords = [...points, points[0]].map(([lat, lng]) => [lng, lat]);
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'Polygon' as const,
            coordinates: [coords],
          },
        },
      ],
    };
  }, [points]);

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-border/80 shadow-md bg-slate-900 select-none">
      {/* Pigeon Map Canvas */}
      <Map
        height={520}
        center={center}
        zoom={zoom}
        onBoundsChanged={({ center: newCenter, zoom: newZoom }) => {
          setCenter(newCenter);
          setZoom(newZoom);
        }}
        onClick={handleMapClick}
        provider={mapType === 'satellite' ? SATELLITE_PROVIDER : STREET_PROVIDER}
        metaWheelZoom={false}
      >
        {/* GeoJSON Polygon / Line Layer */}
        {geojsonData && (
          <GeoJson
            data={geojsonData}
            styleCallback={() => ({
              fill: isCompleted ? 'rgba(16, 185, 129, 0.35)' : 'rgba(59, 130, 246, 0.25)',
              strokeWidth: '3',
              stroke: isCompleted ? '#10b981' : '#3b82f6',
            })}
          />
        )}

        {/* Vertex Draggable Handles */}
        {points.map((pt, idx) => (
          <Draggable
            key={idx}
            anchor={pt}
            offset={[8, 8]}
            onDragEnd={(newAnchor) => handlePointDrag(idx, newAnchor)}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (idx === 0 && points.length >= 3 && !isCompleted && !readOnly) {
                  handleFinish();
                }
              }}
              className={`w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-125 ${
                idx === 0
                  ? 'bg-emerald-500 ring-2 ring-emerald-300 animate-pulse'
                  : idx === points.length - 1
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              title={idx === 0 && points.length >= 3 && !isCompleted ? 'Click to close boundary' : `Vertex ${idx + 1}`}
            />
          </Draggable>
        ))}
      </Map>

      {/* Top Floating Action Bar */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        {!readOnly && (
          <>
            <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-sm">
              {isCompleted ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-xs">
                  <Check className="h-3.5 w-3.5" />
                  Boundary Locked
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 text-xs">
                  <MousePointerClick className="h-3.5 w-3.5" />
                  {points.length === 0
                    ? 'Click map to place 1st point'
                    : points.length < 3
                    ? `Click to place point ${points.length + 1}`
                    : 'Click 1st point or Finish to lock'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 bg-background/90 backdrop-blur-md p-1 rounded-lg border shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={points.length === 0}
                className="h-8 px-2.5 text-xs gap-1 hover:bg-muted"
                title="Undo last point"
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>Undo</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={points.length === 0}
                className="h-8 px-2.5 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Clear all points"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </Button>

              {!isCompleted && points.length >= 3 && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleFinish}
                  className="h-8 px-3 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Finish Boundary</span>
                </Button>
              )}
            </div>
          </>
        )}

        {/* Locate, Fit Bounds & Layer Toggle */}
        <div className="flex items-center gap-1 bg-background/90 backdrop-blur-md p-1 rounded-lg border shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => locateUser(true)}
            className="h-8 px-2.5 text-xs gap-1 hover:bg-muted"
            title="Center to current location"
          >
            <Crosshair className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Locate</span>
          </Button>

          {points.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFitBounds}
              className="h-8 px-2.5 text-xs gap-1 hover:bg-muted"
              title="Fit to parcel boundary"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Fit</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
            className="h-8 px-2.5 text-xs gap-1 hover:bg-muted"
            title="Toggle Satellite / Street Map"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="capitalize">{mapType === 'satellite' ? 'Street' : 'Satellite'}</span>
          </Button>
        </div>
      </div>

      {/* Bottom Right Styled Zoom Controls */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 bg-background/90 backdrop-blur-md p-1 rounded-lg border shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-foreground hover:bg-muted"
          onClick={() => setZoom((z) => Math.min(z + 1, 18))}
          title="Zoom In"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-foreground hover:bg-muted"
          onClick={() => setZoom((z) => Math.max(z - 1, 2))}
          title="Zoom Out"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Bottom Floating Stats Panel */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="bg-background/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-lg border text-xs flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Parcel Stats</div>
              <div className="text-muted-foreground font-mono">
                {stats.points} points · {stats.areaHa.toFixed(4)} ha
              </div>
            </div>
          </div>

          {points.length > 0 && points.length < 3 && (
            <div className="border-l pl-3 text-amber-600 dark:text-amber-400 text-[11px] max-w-[180px] leading-tight">
              Add at least {3 - points.length} more point{3 - points.length > 1 ? 's' : ''} to complete parcel
            </div>
          )}

          {stats.areaHa > 0 && (
            <div className="border-l pl-3 hidden sm:block">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Estimated Credits</div>
              <div className="text-emerald-600 font-semibold font-mono text-xs">
                ~{(stats.areaHa * 25).toFixed(1)} tCO2e/yr
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
