import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface FuelReading {
  id: number;
  fuel_level: number;
  distance: number;
  timestamp: string;
}

const FuelHistory: React.FC = () => {
  const [readings, setReadings] = useState<FuelReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/fuel-readings?limit=100');
        
        if (!response.ok) {
          throw new Error('Failed to fetch fuel readings');
        }
        
        const data = await response.json();
        setReadings(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching fuel readings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReadings();
    
    // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(fetchReadings, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Prepare data for chart
  const chartData = {
    labels: readings.map(reading => {
      const date = new Date(reading.timestamp);
      return date.toLocaleTimeString();
    }),
    datasets: [
      {
        label: 'Fuel Level (L)',
        data: readings.map(reading => reading.fuel_level),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
      {
        label: 'Distance (cm)',
        data: readings.map(reading => reading.distance),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Fuel Level and Distance History',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return <div className="loading">Loading fuel history...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="fuel-history">
      <h2>Fuel Level History</h2>
      {readings.length > 0 ? (
        <>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="readings-table">
            <h3>Recent Readings</h3>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Fuel Level (L)</th>
                  <th>Distance (cm)</th>
                </tr>
              </thead>
              <tbody>
                {readings.slice(0, 10).map((reading) => (
                  <tr key={reading.id}>
                    <td>{new Date(reading.timestamp).toLocaleString()}</td>
                    <td>{reading.fuel_level.toFixed(2)}</td>
                    <td>{reading.distance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p>No fuel readings available yet.</p>
      )}
    </div>
  );
};

export default FuelHistory; 