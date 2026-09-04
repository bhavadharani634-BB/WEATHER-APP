import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  MapPin, 
  Radio, 
  Navigation, 
  Key, 
  X, 
  Check, 
  ExternalLink,
  Wind,
  CloudRain,
  Cloud,
  Globe,
  Thermometer,
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';

interface RadarMapProps {
  latitude: number;
  longitude: number;
  locationName: string;
  country?: string;
}

interface RadarFrame {
  time: number;
  path: string;
}

type ProviderType = 'rainviewer' | 'openweathermap' | 'mapbox';
type BasemapStyle = 'dark' | 'satellite';
type OwmLayerType = 'precipitation_new' | 'temp_new' | 'wind_new' | 'clouds_new';

export const RadarMap: React.FC<RadarMapProps> = ({ latitude, longitude, locationName, country }) => {
  // Sanitize coordinates to prevent any NaN crashes in Leaflet
  const safeLat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : 51.5074;
  const safeLon = typeof longitude === 'number' && !isNaN(longitude) ? longitude : -0.1278;
  const safeLocationName = locationName || 'Target Location';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const prevCoordsRef = useRef<{ lat: number; lon: number } | null>(null);

  // Basemap & Provider State
  const [basemapStyle, setBasemapStyle] = useState<BasemapStyle>('dark');
  const [provider, setProvider] = useState<ProviderType>(() => {
    const saved = localStorage.getItem('weather_map_provider') as ProviderType;
    if (saved) return saved;
    if (import.meta.env.VITE_OPENWEATHER_API_KEY) return 'openweathermap';
    if (import.meta.env.VITE_MAPBOX_API_KEY) return 'mapbox';
    return 'rainviewer';
  });

  const [openWeatherKey, setOpenWeatherKey] = useState<string>(() => {
    return localStorage.getItem('weather_map_owm_key') || 
      (import.meta.env.VITE_OPENWEATHER_API_KEY as string) || '';
  });

  const [mapboxKey, setMapboxKey] = useState<string>(() => {
    return localStorage.getItem('weather_map_mapbox_key') || 
      (import.meta.env.VITE_MAPBOX_API_KEY as string) || '';
  });

  const [owmLayer, setOwmLayer] = useState<OwmLayerType>('precipitation_new');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // RainViewer Radar State
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [radarHost, setRadarHost] = useState<string>('https://tilecache.rainviewer.com');
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [layerType, setLayerType] = useState<'radar' | 'satellite'>('radar');
  const [satelliteFrames, setSatelliteFrames] = useState<RadarFrame[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Determine base tile URL - Esri Dark Gray (Free, zero-watermark default!)
  const getBaseTileUrl = useCallback((style: BasemapStyle, mbKey: string, prov: ProviderType) => {
    if (prov === 'mapbox' && mbKey) {
      return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${mbKey}`;
    }
    if (style === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    // High-performance, free, clean dark canvas without any "API KEY REQUIRED" watermark
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize map with sanitized coordinates
    const map = L.map(mapContainerRef.current, {
      center: [safeLat, safeLon],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
    });

    const baseTileUrl = getBaseTileUrl(basemapStyle, mapboxKey, provider);
    const baseLayer = L.tileLayer(baseTileUrl, {
      maxNativeZoom: 16,
      maxZoom: 18,
      opacity: 0.95,
      zIndex: 1,
    }).addTo(map);

    baseLayerRef.current = baseLayer;

    // Custom Glowing Marker for current city
    const pulseIcon = L.divIcon({
      className: 'radar-city-marker',
      html: `
        <div style="position:relative; display:flex; align-items:center; justify-content:center; width:28px; height:28px;">
          <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:#FEC700; opacity:0.6; animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width:14px; height:14px; border-radius:50%; background:#FEC700; border:2.5px solid white; box-shadow:0 0 12px #FEC700;"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([safeLat, safeLon], { icon: pulseIcon }).addTo(map);
    marker.bindPopup(`<b>${safeLocationName}</b><br/><span style="font-size:11px;color:#666;">Weather Radar Target</span>`);

    mapInstanceRef.current = map;
    markerRef.current = marker;
    prevCoordsRef.current = { lat: safeLat, lon: safeLon };

    // Invalidate size on initial mount after DOM layout settles
    const t1 = setTimeout(() => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      } catch {
        // ignore
      }
    }, 150);

    const t2 = setTimeout(() => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      } catch {
        // ignore
      }
    }, 500);

    // Watch for container resizes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        try {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        } catch {
          // ignore
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) resizeObserver.disconnect();
      try {
        map.remove();
      } catch {
        // ignore
      }
      mapInstanceRef.current = null;
    };
  }, []);

  // Update base layer if basemapStyle, mapboxKey, or provider changes
  useEffect(() => {
    if (!baseLayerRef.current) return;
    const newUrl = getBaseTileUrl(basemapStyle, mapboxKey, provider);
    baseLayerRef.current.setUrl(newUrl);
  }, [basemapStyle, mapboxKey, provider, getBaseTileUrl]);

  // Update map center & marker when coordinates change (preventing NaN flyTo errors)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    const map = mapInstanceRef.current;

    // Check if coordinates really changed
    if (
      prevCoordsRef.current &&
      prevCoordsRef.current.lat === safeLat &&
      prevCoordsRef.current.lon === safeLon
    ) {
      // Just update popup text
      markerRef.current.setPopupContent(`<b>${safeLocationName}</b><br/><span style="font-size:11px;color:#666;">${country || ''}</span>`);
      return;
    }

    prevCoordsRef.current = { lat: safeLat, lon: safeLon };

    markerRef.current.setLatLng([safeLat, safeLon]);
    markerRef.current.setPopupContent(`<b>${safeLocationName}</b><br/><span style="font-size:11px;color:#666;">${country || ''}</span>`);

    try {
      map.invalidateSize();
      const size = map.getSize();
      if (size && size.x > 0 && size.y > 0) {
        map.flyTo([safeLat, safeLon], 8, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      } else {
        map.setView([safeLat, safeLon], 8);
      }
    } catch {
      try {
        map.setView([safeLat, safeLon], 8);
      } catch {
        // ignore
      }
    }
  }, [safeLat, safeLon, safeLocationName, country]);

  // Fetch RainViewer radar metadata (free Doppler radar)
  useEffect(() => {
    const fetchRadarMetadata = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get('https://api.rainviewer.com/public/weather-maps.json', { timeout: 8000 });
        const data = res.data;
        if (data && data.host && data.radar && data.radar.past) {
          setRadarHost(data.host);
          setRadarFrames(data.radar.past);
          if (data.satellite && data.satellite.infrared) {
            setSatelliteFrames(data.satellite.infrared);
          }
          setCurrentFrameIndex(data.radar.past.length - 1);
        }
      } catch (err) {
        console.warn('RainViewer radar metadata warning:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRadarMetadata();
    const interval = setInterval(fetchRadarMetadata, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update Radar Layer based on provider and selected layers
  const activeFrames = layerType === 'radar' ? radarFrames : satelliteFrames;
  const currentFrame = activeFrames[currentFrameIndex];

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (radarLayerRef.current) {
      map.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    // OpenWeatherMap Layer with API Key
    if (provider === 'openweathermap' && openWeatherKey) {
      const owmUrl = `https://tile.openweathermap.org/map/${owmLayer}/{z}/{x}/{y}.png?appid=${openWeatherKey}`;
      const newLayer = L.tileLayer(owmUrl, {
        opacity: 0.8,
        zIndex: 50,
        maxZoom: 18,
      }).addTo(map);
      radarLayerRef.current = newLayer;
      return;
    }

    // RainViewer Radar Frame Layer (Default free Doppler radar)
    if (currentFrame && radarHost) {
      const tileUrl = layerType === 'radar'
        ? `${radarHost}${currentFrame.path}/256/{z}/{x}/{y}/2/1_1.png`
        : `${radarHost}${currentFrame.path}/256/{z}/{x}/{y}/0/0_0.png`;

      const newLayer = L.tileLayer(tileUrl, {
        opacity: 0.78,
        zIndex: 50,
        maxZoom: 18,
      }).addTo(map);

      radarLayerRef.current = newLayer;
    }
  }, [provider, openWeatherKey, owmLayer, currentFrame, radarHost, layerType]);

  // Animation player loop (for RainViewer radar)
  useEffect(() => {
    if (provider === 'openweathermap' || !isPlaying || activeFrames.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % activeFrames.length);
    }, 750);

    return () => clearInterval(timer);
  }, [isPlaying, activeFrames.length, provider]);

  const recenterMap = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    try {
      map.invalidateSize();
      const size = map.getSize();
      if (size && size.x > 0 && size.y > 0) {
        map.flyTo([safeLat, safeLon], 8, { duration: 1.2 });
      } else {
        map.setView([safeLat, safeLon], 8);
      }
    } catch {
      map.setView([safeLat, safeLon], 8);
    }
  }, [safeLat, safeLon]);

  const handleOpenKeyModal = () => {
    if (provider === 'openweathermap') {
      setKeyInput(openWeatherKey);
    } else if (provider === 'mapbox') {
      setKeyInput(mapboxKey);
    } else {
      setKeyInput(openWeatherKey || mapboxKey || '');
    }
    setSaveSuccessMsg('');
    setShowKeyModal(true);
  };

  const handleSaveApiKey = () => {
    const trimmed = keyInput.trim();
    
    // Auto-detect provider if user pasted into default view
    let targetProvider = provider;
    if (targetProvider === 'rainviewer' && trimmed) {
      if (trimmed.startsWith('pk.')) {
        targetProvider = 'mapbox';
      } else {
        targetProvider = 'openweathermap';
      }
    }

    if (targetProvider === 'openweathermap') {
      setOpenWeatherKey(trimmed);
      localStorage.setItem('weather_map_owm_key', trimmed);
      setProvider('openweathermap');
      localStorage.setItem('weather_map_provider', 'openweathermap');
    } else if (targetProvider === 'mapbox') {
      setMapboxKey(trimmed);
      localStorage.setItem('weather_map_mapbox_key', trimmed);
      setProvider('mapbox');
      localStorage.setItem('weather_map_provider', 'mapbox');
    } else {
      setProvider('rainviewer');
      localStorage.setItem('weather_map_provider', 'rainviewer');
    }

    setSaveSuccessMsg('API Key applied and saved successfully!');
    setTimeout(() => {
      setShowKeyModal(false);
      setSaveSuccessMsg('');
    }, 900);
  };

  const handleRemoveApiKey = () => {
    if (provider === 'openweathermap') {
      setOpenWeatherKey('');
      localStorage.removeItem('weather_map_owm_key');
    } else if (provider === 'mapbox') {
      setMapboxKey('');
      localStorage.removeItem('weather_map_mapbox_key');
    }
    setProvider('rainviewer');
    localStorage.setItem('weather_map_provider', 'rainviewer');
    setShowKeyModal(false);
  };

  const frameTimeLabel = currentFrame
    ? format(new Date(currentFrame.time * 1000), 'h:mm a')
    : 'Live';

  const isLatestFrame = currentFrameIndex === activeFrames.length - 1;
  const isKeyActive = (provider === 'openweathermap' && Boolean(openWeatherKey)) || 
                      (provider === 'mapbox' && Boolean(mapboxKey));

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Radar Header Bar */}
      <div className="liquid-glass-dark rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/15">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FEC700]/20 flex items-center justify-center border border-[#FEC700]/40 text-[#FEC700]">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="text-white font-bold text-base tracking-wide flex items-center gap-1.5">
                Live Weather Radar
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/80 text-white animate-pulse">
                LIVE
              </span>
              {isKeyActive ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEC700] text-[#20462E] flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{provider === 'openweathermap' ? 'OpenWeather HD' : 'Mapbox HD'}</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Doppler Radar
                </span>
              )}
            </div>
            <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-[#FEC700]" />
              <span className="font-semibold text-white/90">{safeLocationName}</span>
              {country && <span>• {country}</span>}
              <span>• {provider === 'openweathermap' ? 'OpenWeather HD Layer' : `Frame: ${frameTimeLabel}`}</span>
            </p>
          </div>
        </div>

        {/* Controls: Basemap Style, Layer Switcher, API Key Button & Recenter */}
        <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-y-2">
          {/* Basemap Toggle: Dark vs Satellite */}
          <div className="liquid-glass-dark p-1 rounded-xl flex border border-white/10 text-xs">
            <button
              onClick={() => setBasemapStyle('dark')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                basemapStyle === 'dark'
                  ? 'bg-[#FEC700] text-[#20462E] font-bold shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setBasemapStyle('satellite')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                basemapStyle === 'satellite'
                  ? 'bg-[#FEC700] text-[#20462E] font-bold shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>Satellite</span>
            </button>
          </div>

          {/* RainViewer Doppler vs Satellite Clouds toggle */}
          {provider === 'rainviewer' && (
            <div className="liquid-glass-dark p-1 rounded-xl flex border border-white/10 text-xs">
              <button
                onClick={() => setLayerType('radar')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  layerType === 'radar'
                    ? 'bg-[#FEC700] text-[#20462E] font-bold shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <CloudRain className="h-3 w-3" />
                <span>Radar</span>
              </button>
              <button
                onClick={() => setLayerType('satellite')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  layerType === 'satellite'
                    ? 'bg-[#FEC700] text-[#20462E] font-bold shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Cloud className="h-3 w-3" />
                <span>Clouds</span>
              </button>
            </div>
          )}

          {/* Layer switcher for OpenWeatherMap if key is provided */}
          {provider === 'openweathermap' && openWeatherKey && (
            <div className="liquid-glass-dark p-1 rounded-xl flex border border-white/10 text-xs">
              <button
                onClick={() => setOwmLayer('precipitation_new')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  owmLayer === 'precipitation_new'
                    ? 'bg-[#FEC700] text-[#20462E] font-bold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <CloudRain className="h-3 w-3" />
                <span>Precip</span>
              </button>
              <button
                onClick={() => setOwmLayer('temp_new')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  owmLayer === 'temp_new'
                    ? 'bg-[#FEC700] text-[#20462E] font-bold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Thermometer className="h-3 w-3" />
                <span>Temp</span>
              </button>
              <button
                onClick={() => setOwmLayer('wind_new')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  owmLayer === 'wind_new'
                    ? 'bg-[#FEC700] text-[#20462E] font-bold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Wind className="h-3 w-3" />
                <span>Wind</span>
              </button>
              <button
                onClick={() => setOwmLayer('clouds_new')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  owmLayer === 'clouds_new'
                    ? 'bg-[#FEC700] text-[#20462E] font-bold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Cloud className="h-3 w-3" />
                <span>Clouds</span>
              </button>
            </div>
          )}

          {/* API Key Modal Trigger */}
          <button
            onClick={handleOpenKeyModal}
            title="Configure Map API Key"
            className={`p-2 rounded-xl border transition-all flex items-center space-x-1 text-xs font-semibold cursor-pointer ${
              isKeyActive
                ? 'bg-[#FEC700]/20 text-[#FEC700] border-[#FEC700]/50'
                : 'liquid-glass-dark border-white/15 text-white/80 hover:text-white hover:border-[#FEC700]/40'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>{isKeyActive ? 'Key Active' : 'API Key'}</span>
            {isKeyActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>

          {/* Recenter Button */}
          <button
            onClick={recenterMap}
            title="Recenter Map on Current City"
            className="p-2 rounded-xl liquid-glass-dark border border-white/15 text-white/80 hover:text-white hover:border-[#FEC700]/50 transition-colors cursor-pointer"
          >
            <Navigation className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Interactive Map Viewport Container */}
      <div className="w-full relative h-[420px] sm:h-[460px] rounded-3xl overflow-hidden liquid-glass-dark border border-white/20 shadow-2xl">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {isLoading && (
          <div className="absolute inset-0 bg-[#20462E]/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#FEC700] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white text-xs font-semibold">Connecting to Doppler Radar...</span>
          </div>
        )}

        {/* RainViewer Playback Controls Overlay (when using animated radar) */}
        {provider !== 'openweathermap' && (
          <div className="absolute bottom-4 left-4 right-4 z-10 liquid-glass-dark rounded-2xl p-3 px-4 border border-white/20 backdrop-blur-xl shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-white">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-[#FEC700] text-[#20462E] hover:scale-105 transition-transform cursor-pointer"
                  title={isPlaying ? 'Pause Radar Loop' : 'Play Radar Loop'}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>

                <button
                  onClick={() => setCurrentFrameIndex(0)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/80 cursor-pointer"
                  title="Restart Loop"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>

                <span className="font-semibold text-white/90">
                  {frameTimeLabel} {isLatestFrame && <span className="text-[#FEC700]">(Now)</span>}
                </span>
              </div>

              <div className="text-[11px] text-white/60">
                {activeFrames.length > 0 ? `${currentFrameIndex + 1} / ${activeFrames.length} frames` : 'Live radar active'}
              </div>
            </div>

            {/* Timeline Scrubber Slider */}
            <input
              type="range"
              min={0}
              max={Math.max(0, activeFrames.length - 1)}
              value={currentFrameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentFrameIndex(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FEC700]"
            />
          </div>
        )}

        {/* Rain Intensity Color Legend (Top Right) */}
        <div className="absolute top-4 right-4 z-10 liquid-glass-dark rounded-xl p-2 px-3 border border-white/15 backdrop-blur-md hidden sm:flex flex-col gap-1 shadow-md">
          <span className="text-[10px] uppercase font-bold text-white/70 tracking-wider">
            {provider === 'openweathermap' ? owmLayer.replace('_new', '').toUpperCase() : 'Precipitation'}
          </span>
          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] text-white/50">Light</span>
            <div className="w-24 h-2 rounded-full bg-gradient-to-r from-[#00ffff] via-[#ffff00] via-[#ff7800] to-[#ff00ff]"></div>
            <span className="text-[9px] text-white/50">Heavy</span>
          </div>
        </div>
      </div>

      {/* Map API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="liquid-glass rounded-3xl p-6 max-w-md w-full border border-white/20 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-[#FEC700]" />
                <h3 className="text-lg font-bold text-white">Radar & Map API Key</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded-full text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-white/70 text-xs leading-relaxed mb-4">
              Attach your personal API key for OpenWeatherMap (HD precipitation, temperature, wind, and clouds) or Mapbox (custom satellite styles). The app also has built-in free Doppler radar without any API key required!
            </p>

            {/* Provider Selector */}
            <div className="flex space-x-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setProvider('rainviewer');
                  setKeyInput('');
                }}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  provider === 'rainviewer'
                    ? 'bg-[#FEC700] text-[#20462E] border-[#FEC700] font-bold'
                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                }`}
              >
                Free Doppler
              </button>

              <button
                type="button"
                onClick={() => {
                  setProvider('openweathermap');
                  setKeyInput(openWeatherKey);
                }}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  provider === 'openweathermap'
                    ? 'bg-[#FEC700] text-[#20462E] border-[#FEC700] font-bold'
                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                }`}
              >
                OpenWeather
              </button>

              <button
                type="button"
                onClick={() => {
                  setProvider('mapbox');
                  setKeyInput(mapboxKey);
                }}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  provider === 'mapbox'
                    ? 'bg-[#FEC700] text-[#20462E] border-[#FEC700] font-bold'
                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                }`}
              >
                Mapbox
              </button>
            </div>

            {/* Input Field for API Key */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  {provider === 'openweathermap' 
                    ? 'OpenWeatherMap API Key (32 characters)' 
                    : provider === 'mapbox' 
                    ? 'Mapbox Access Token (starts with pk.)' 
                    : 'Attach API Key (Optional)'}
                </label>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={
                    provider === 'openweathermap' 
                      ? 'Paste your OpenWeatherMap key (e.g. 4a3b8c9d0e1f...)' 
                      : provider === 'mapbox'
                      ? 'Paste your Mapbox token (pk.eyJ1...)'
                      : 'Paste any OpenWeather or Mapbox API key here...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder-white/40 focus:outline-none focus:border-[#FEC700]"
                />
              </div>

              {provider === 'rainviewer' && !keyInput && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center space-x-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Free Doppler radar is 100% active without needing any key. Paste a key above anytime to upgrade to OpenWeather HD.</span>
                </div>
              )}

              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-200 flex items-center space-x-2 animate-in fade-in">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-white/50">
                <span>Key is saved securely in your browser</span>
                <a 
                  href={provider === 'openweathermap' ? 'https://openweathermap.org/api' : 'https://account.mapbox.com'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[#FEC700] hover:underline flex items-center space-x-1"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              {isKeyActive && (
                <button
                  type="button"
                  onClick={handleRemoveApiKey}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  Remove Key
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#FEC700] text-[#20462E] hover:scale-105 transition-transform cursor-pointer shadow-md"
              >
                Apply Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
