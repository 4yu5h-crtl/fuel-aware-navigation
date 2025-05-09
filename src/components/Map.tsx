import React, { useState, useCallback, useEffect } from 'react';
import { 
  GoogleMap, 
  LoadScript, 
  DirectionsService, 
  DirectionsRenderer, 
  Marker,
  Autocomplete
} from '@react-google-maps/api';
import { 
  Box, 
  TextField, 
  Button, 
  Alert, 
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  Paper
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';

const containerStyle = {
  width: '100%',
  height: '500px'
};

const center = {
  lat: 20.5937,  // Default center (India)
  lng: 78.9629
};

const libraries: ["places"] = ["places"];

// Get API key from environment variable
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

interface MapProps {
  fuelLevel: number;
  onRouteCalculated: (distance: number) => void;
}

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface RouteOption {
  route: google.maps.DirectionsResult;
  distance: number;
  duration: number;
  fuelRequired: number;
  isEfficient: boolean;
}

// Constants for fuel calculations
const FUEL_CONSUMPTION_RATE = 0.08; // Liters per kilometer - This is the rate at which the vehicle consumes fuel
// This value represents how many liters of fuel are consumed for every kilometer traveled
// For example: 0.08 L/km means the vehicle uses 8 liters of fuel for every 100 kilometers

const Map: React.FC<MapProps> = ({ fuelLevel, onRouteCalculated }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState('');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          // Get address from coordinates using Geocoding service
          try {
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({
              location: { lat: location.lat, lng: location.lng }
            });
            if (result.results[0]) {
              location.address = result.results[0].formatted_address;
            }
          } catch (error) {
            console.error('Geocoding error:', error);
          }

          setCurrentLocation(location);
          setIsLoading(false);
          setError(null);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Could not get your location. Please allow location access.');
          setIsLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
    }
  };

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setDestination(place.formatted_address);
      }
    }
  };

  const directionsCallback = useCallback((
    result: google.maps.DirectionsResult | null,
    status: google.maps.DirectionsStatus
  ) => {
    setIsCalculating(false);
    if (result !== null && status === 'OK') {
      // Process multiple routes provided by Google Maps
      const options: RouteOption[] = result.routes.map(route => {
        // Convert distance from meters to kilometers (divide by 1000)
        const distance = route.legs[0].distance?.value! / 1000; // km
        // Convert duration from seconds to minutes (divide by 60)
        const duration = route.legs[0].duration?.value! / 60; // minutes
        
        // Calculate fuel required for this route
        // Formula: Fuel Required = Distance (km) * Fuel Consumption Rate (L/km)
        const fuelRequired = distance * FUEL_CONSUMPTION_RATE;
        
        // Check if the route is feasible with current fuel level
        // A route is considered efficient if the required fuel is less than or equal to available fuel
        const isEfficient = fuelRequired <= fuelLevel;
        
        return {
          route: { ...result, routes: [route] },
          distance,
          duration,
          fuelRequired,
          isEfficient
        };
      });

      // Sort routes based on two criteria:
      // 1. First priority: Routes that are feasible with current fuel (isEfficient = true)
      // 2. Second priority: Routes that require less fuel (most fuel-efficient)
      options.sort((a, b) => {
        // Prioritize routes that are feasible with current fuel
        if (a.isEfficient && !b.isEfficient) return -1;
        if (!a.isEfficient && b.isEfficient) return 1;
        // Then sort by fuel consumption (ascending order)
        return a.fuelRequired - b.fuelRequired;
      });

      setRouteOptions(options);
      setDirections(options[0].route);
      setSelectedRouteIndex(0);
      onRouteCalculated(options[0].distance);
      setError(null);
    } else {
      setError('Could not calculate directions. Please check the addresses and try again.');
      setDirections(null);
      setRouteOptions([]);
    }
  }, [fuelLevel, onRouteCalculated]);

  const handleRouteSelection = (index: number) => {
    setSelectedRouteIndex(index);
    setDirections(routeOptions[index].route);
    onRouteCalculated(routeOptions[index].distance);
  };

  const handleCalculateRoute = () => {
    setError(null);
    if (!currentLocation || !destination) {
      setError('Please enter a destination');
      return;
    }
    setIsCalculating(true);
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Alert severity="error">
        Google Maps API key is missing. Please set the REACT_APP_GOOGLE_MAPS_API_KEY environment variable.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            label="Your Location"
            value={currentLocation?.address || ''}
            disabled
            InputProps={{
              endAdornment: (
                <Button
                  onClick={getCurrentLocation}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <MyLocationIcon />}
                  size="small"
                  disabled={isLoading}
                >
                  {isLoading ? 'Getting Location...' : 'Update'}
                </Button>
              ),
            }}
            sx={{ 
              '& .MuiInputBase-root': {
                height: '56px'
              }
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
            <Autocomplete
              onLoad={onLoad}
              onPlaceChanged={onPlaceChanged}
            >
              <TextField
                fullWidth
                label="Destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination address"
                sx={{ 
                  '& .MuiInputBase-root': {
                    height: '56px'
                  }
                }}
              />
            </Autocomplete>
          </LoadScript>
        </Box>
        <Button 
          variant="contained" 
          onClick={handleCalculateRoute}
          disabled={isCalculating || !currentLocation}
          sx={{ 
            fontWeight: 'bold',
            minWidth: '120px',
            height: '56px'
          }}
        >
          {isCalculating ? <CircularProgress size={24} color="inherit" /> : 'Calculate'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {routeOptions.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Available Routes</Typography>
          <RadioGroup
            value={selectedRouteIndex}
            onChange={(e) => handleRouteSelection(Number(e.target.value))}
          >
            {routeOptions.map((option, index) => (
              <FormControlLabel
                key={index}
                value={index.toString()}
                control={<Radio />}
                label={
                  <Box>
                    <Typography>
                      Route {index + 1} - {option.distance.toFixed(1)}km 
                      ({Math.round(option.duration)} mins)
                    </Typography>
                    <Typography variant="body2" color={option.isEfficient ? "success.main" : "error.main"}>
                      {option.isEfficient ? (
                        // Display for routes with sufficient fuel
                        <>
                          Fuel required: {option.fuelRequired.toFixed(1)}L 
                          (Remaining: {(fuelLevel - option.fuelRequired).toFixed(1)}L)
                        </>
                      ) : (
                        // Display for routes with insufficient fuel
                        <>
                          <LocalGasStationIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                          Insufficient fuel - Need {option.fuelRequired.toFixed(1)}L 
                          (Short by {(option.fuelRequired - fuelLevel).toFixed(1)}L)
                        </>
                      )}
                    </Typography>
                  </Box>
                }
                sx={{
                  backgroundColor: option.isEfficient ? 'success.light' : 'error.light',
                  borderRadius: 1,
                  mb: 1,
                  p: 1
                }}
              />
            ))}
          </RadioGroup>
        </Paper>
      )}

      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={currentLocation || center}
          zoom={12}
        >
          {currentLocation && (
            <Marker
              position={currentLocation}
              title="Your Location"
            />
          )}
          
          {currentLocation && destination && (
            <DirectionsService
              options={{
                destination: destination,
                origin: { lat: currentLocation.lat, lng: currentLocation.lng },
                travelMode: google.maps.TravelMode.DRIVING,
                region: 'IN',
                provideRouteAlternatives: true // Request multiple routes
              }}
              callback={directionsCallback}
            />
          )}
          
          {directions && (
            <DirectionsRenderer
              options={{
                directions: directions,
                markerOptions: {
                  visible: false
                }
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </Box>
  );
};

export default Map; 