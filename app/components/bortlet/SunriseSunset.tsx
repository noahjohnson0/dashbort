'use client';

import { useState, useEffect, useRef } from 'react';
import { Sunrise, Sunset, Sun, Moon, MapPin, X } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, useSaveUserLocation, useUserLocation } from '@/lib/firebase';

interface SunTimes {
  sunrise: string;
  sunset: string;
  isDay: boolean;
}

const LOCATION_STORAGE_KEY = 'dashbort_location_zipcode';
const LOCATION_NAME_KEY = 'dashbort_location_name';

export default function SunriseSunset() {
  const [user] = useAuthState(auth);
  const [savedLocation, locationLoading, locationError] = useUserLocation(user?.uid || null);
  const [saveLocation, saveLocationLoading, saveLocationError] = useSaveUserLocation(user?.uid || null);
  
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [zipcode, setZipcode] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const hasInitialized = useRef(false);

  const fetchSunTimes = async (lat: number, lon: number) => {
    try {
      // Using a free API for sunrise/sunset times
      const response = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const sunrise = new Date(data.results.sunrise);
        const sunset = new Date(data.results.sunset);
        const now = new Date();

        setSunTimes({
          sunrise: formatTime(sunrise),
          sunset: formatTime(sunset),
          isDay: now >= sunrise && now < sunset,
        });
      } else {
        setError('Failed to fetch sun times');
      }
    } catch (err) {
      setError('Error fetching sun times');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const geocodeZipcode = async (zip: string) => {
    if (!zip || zip.trim().length === 0) {
      setError('Please enter a valid zipcode');
      return;
    }

    setIsGeocoding(true);
    setError(null);
    setLoading(true);

    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'Dashbort/1.0' // Required by Nominatim
          }
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const address = data[0].address || {};
        
        // Extract location name (city, town, village, or municipality)
        const locationName = 
          address.city || 
          address.town || 
          address.village || 
          address.municipality || 
          address.county || 
          '';
        
        // Include state/region if available for better context
        const state = address.state || address.region || '';
        const displayName = state 
          ? `${locationName}, ${state}` 
          : locationName || zip;
        
        setLocation({ lat, lon });
        setLocationName(displayName);
        localStorage.setItem(LOCATION_STORAGE_KEY, zip);
        localStorage.setItem(LOCATION_NAME_KEY, displayName);
        setZipcode(zip);
        setIsEditingLocation(false);
        
        // Save location to Firebase
        if (user?.uid) {
          try {
            await saveLocation({
              latitude: lat,
              longitude: lon,
              timestamp: Date.now(),
            });
          } catch (err) {
            console.error('Failed to save location to Firebase:', err);
            // Don't block the UI if Firebase save fails
          }
        }
        
        await fetchSunTimes(lat, lon);
      } else {
        setError('Zipcode not found. Please try another zipcode.');
        setLoading(false);
      }
    } catch (err) {
      setError('Error looking up zipcode. Please try again.');
      console.error(err);
      setLoading(false);
    } finally {
      setIsGeocoding(false);
    }
  };

  const getAutoLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude });
          
          // Save location to Firebase
          if (user?.uid) {
            try {
              await saveLocation({
                latitude,
                longitude,
                timestamp: Date.now(),
              });
            } catch (err) {
              console.error('Failed to save location to Firebase:', err);
              // Don't block the UI if Firebase save fails
            }
          }
          
          await fetchSunTimes(latitude, longitude);
        },
        (err) => {
          setError('Unable to get location. Please set a zipcode manually.');
          setLoading(false);
          setIsEditingLocation(true);
          // Fallback to a default location (San Francisco)
          fetchSunTimes(37.7749, -122.4194);
        }
      );
    } else {
      setError('Geolocation is not supported. Please set a zipcode manually.');
      setLoading(false);
      setIsEditingLocation(true);
      // Fallback to a default location
      fetchSunTimes(37.7749, -122.4194);
    }
  };

  const handleZipcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    geocodeZipcode(zipcode);
  };

  const handleUseCurrentLocation = () => {
    localStorage.removeItem(LOCATION_STORAGE_KEY);
    localStorage.removeItem(LOCATION_NAME_KEY);
    setZipcode('');
    setLocationName('');
    setIsEditingLocation(false);
    setError(null);
    setLoading(true);
    getAutoLocation();
  };

  useEffect(() => {
    // Reset initialization when user changes
    hasInitialized.current = false;
  }, [user?.uid]);

  useEffect(() => {
    // Skip if already initialized
    if (hasInitialized.current) return;
    
    // Wait for location loading to complete
    if (locationLoading) return;
    
    // First, try to load location from Firebase if user is authenticated
    if (user?.uid && savedLocation) {
      setLocation({ lat: savedLocation.latitude, lon: savedLocation.longitude });
      fetchSunTimes(savedLocation.latitude, savedLocation.longitude);
      hasInitialized.current = true;
      return;
    }
    
    // Fallback to localStorage if Firebase doesn't have location
    const savedZipcode = localStorage.getItem(LOCATION_STORAGE_KEY);
    const savedLocationName = localStorage.getItem(LOCATION_NAME_KEY);
    if (savedZipcode) {
      setZipcode(savedZipcode);
      if (savedLocationName) {
        setLocationName(savedLocationName);
      }
      geocodeZipcode(savedZipcode);
    } else {
      // Get user's location automatically
      getAutoLocation();
    }
    
    hasInitialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, savedLocation, locationLoading]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 select-none">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Sunrise & Sunset
        </h2>
        <button
          onClick={() => setIsEditingLocation(!isEditingLocation)}
          className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          aria-label="Edit location"
        >
          {isEditingLocation ? <X className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
        </button>
      </div>

      {isEditingLocation ? (
        <div className="space-y-4">
          <form onSubmit={handleZipcodeSubmit} className="space-y-3">
            <div>
              <label htmlFor="zipcode" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Zipcode
              </label>
              <div className="flex gap-2">
                <input
                  id="zipcode"
                  type="text"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  placeholder="Enter zipcode"
                  className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isGeocoding}
                />
                <button
                  type="submit"
                  disabled={isGeocoding || !zipcode.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGeocoding ? '...' : 'Save'}
                </button>
              </div>
            </div>
            {zipcode && (
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Use current location instead
              </button>
            )}
          </form>
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
          )}
        </div>
      ) : (
        <>
          {loading ? (
            <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
          ) : error && !sunTimes ? (
            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Sunrise className="h-8 w-8 text-orange-500" />
                <div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Sunrise</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {sunTimes?.sunrise}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Sunset className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Sunset</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {sunTimes?.sunset}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <span>Currently:</span>
                  <span className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                    {sunTimes?.isDay ? (
                      <>
                        <Sun className="h-4 w-4 text-yellow-500" />
                        Day
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4 text-blue-400" />
                        Night
                      </>
                    )}
                  </span>
                </div>
                {(locationName || zipcode) && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    Location: {locationName || zipcode}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

