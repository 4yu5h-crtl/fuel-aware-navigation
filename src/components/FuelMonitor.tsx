import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, LinearProgress, Alert, Chip, Button } from '@mui/material';
import axios from 'axios';
import RefreshIcon from '@mui/icons-material/Refresh';

interface FuelMonitorProps {
  distance?: number;
}

const FUEL_CONSUMPTION_RATE = 0.08; // Liters per kilometer (example value)
const ESP32_SERVER_URL = 'http://192.168.29.213'; // ESP32's IP address
const AUTO_REFRESH_INTERVAL = 30 * 1000; // 30 seconds in milliseconds

interface FuelData {
  fuelLevel: number;
  timestamp: number;
  unit: string;
  isSimulated: boolean;
}

const FuelMonitor: React.FC<FuelMonitorProps> = ({ distance }) => {
  const [fuelLevel, setFuelLevel] = useState<number>(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date | null>(null);

  const fetchFuelLevel = useCallback(async () => {
    setIsRefreshing(true);
    try {
      console.log('Fetching fuel level data...');
      const response = await axios.get<FuelData>(`${ESP32_SERVER_URL}/fuel-level`, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      setFuelLevel(response.data.fuelLevel);
      setLastUpdate(new Date());
      setNextRefreshTime(new Date(Date.now() + AUTO_REFRESH_INTERVAL));
      setError(null);
      setIsConnected(true);
    } catch (error) {
      console.error('Error fetching fuel level:', error);
      setError('Unable to connect to ESP32. Please check the connection.');
      setIsConnected(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchFuelLevel();
    const interval = setInterval(fetchFuelLevel, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchFuelLevel]);

  // Countdown timer for next refresh
  useEffect(() => {
    if (!nextRefreshTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      if (nextRefreshTime <= now) {
        setNextRefreshTime(new Date(Date.now() + AUTO_REFRESH_INTERVAL));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextRefreshTime]);

  useEffect(() => {
    if (distance && fuelLevel) {
      const estimatedFuelNeeded = distance * FUEL_CONSUMPTION_RATE;
      if (estimatedFuelNeeded > fuelLevel) {
        setWarning(`Warning: Insufficient fuel for the journey. You need ${estimatedFuelNeeded.toFixed(2)}L but have ${fuelLevel.toFixed(2)}L. Please refuel!`);
      } else {
        const remainingFuel = fuelLevel - estimatedFuelNeeded;
        setWarning(remainingFuel < 5 ? 'Low fuel after journey. Consider refueling.' : null);
      }
    }
  }, [distance, fuelLevel]);

  const getNextRefreshText = () => {
    if (!nextRefreshTime) return '';
    const now = new Date();
    const diff = Math.max(0, nextRefreshTime.getTime() - now.getTime());
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `Next refresh in ${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6">
          Fuel Level: {fuelLevel.toFixed(2)}L
        </Typography>
        <Chip 
          label={isConnected ? "Connected to ESP32" : "Disconnected"} 
          color={isConnected ? "success" : "error"} 
          size="small"
        />
        {lastUpdate && (
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {getNextRefreshText()}
        </Typography>
        <Button 
          variant="outlined" 
          size="small"
          onClick={fetchFuelLevel}
          disabled={isRefreshing}
          startIcon={<RefreshIcon />}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
        </Button>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={(fuelLevel / 50) * 100} 
        sx={{ 
          height: 10, 
          borderRadius: 5,
          backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: fuelLevel < 10 ? '#f44336' : '#4caf50'
          }
        }}
      />
      
      {error && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {warning && (
        <Alert 
          severity={warning.includes('Insufficient') ? 'error' : 'warning'} 
          sx={{ mt: 2 }}
        >
          {warning}
        </Alert>
      )}
    </Box>
  );
};

export default FuelMonitor; 