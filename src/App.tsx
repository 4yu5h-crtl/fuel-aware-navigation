import React, { useState } from 'react';
import { Container, Paper, Typography, Box, Tabs, Tab } from '@mui/material';
import Map from './components/Map';
import FuelMonitor from './components/FuelMonitor';
import FuelHistory from './components/FuelHistory';

function App() {
  const [distance, setDistance] = useState<number | undefined>();
  const [tabValue, setTabValue] = useState(0);

  const handleRouteCalculated = (calculatedDistance: number) => {
    setDistance(calculatedDistance);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          align="center"
          sx={{ 
            fontWeight: 'bold',
            color: '#1976d2',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          IoT Based Fuel Efficient Route Optimizer
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <FuelMonitor distance={distance} />
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Map" />
            <Tab label="Fuel History" />
          </Tabs>
          
          {tabValue === 0 && (
            <Map 
              fuelLevel={0} 
              onRouteCalculated={handleRouteCalculated}
            />
          )}
          
          {tabValue === 1 && (
            <FuelHistory />
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default App;
