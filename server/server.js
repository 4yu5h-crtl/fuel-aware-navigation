const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123four', // Change this to your MySQL password
  database: 'fuel_monitor'
});

// Store the last reading to compare with new readings
let lastReading = {
  fuelLevel: null,
  distance: null
};

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Create database if it doesn't exist
  db.query('CREATE DATABASE IF NOT EXISTS fuel_monitor', (err) => {
    if (err) {
      console.error('Error creating database:', err);
      return;
    }
    
    // Use the database
    db.query('USE fuel_monitor', (err) => {
      if (err) {
        console.error('Error using database:', err);
        return;
      }
      
      // Create fuel_readings table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS fuel_readings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          fuel_level FLOAT NOT NULL,
          distance FLOAT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      db.query(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          return;
        }
        console.log('Fuel readings table created or already exists');
        
        // Get the last reading from the database to initialize lastReading
        db.query('SELECT fuel_level, distance FROM fuel_readings ORDER BY timestamp DESC LIMIT 1', (err, results) => {
          if (err) {
            console.error('Error fetching last reading:', err);
            return;
          }
          
          if (results.length > 0) {
            lastReading.fuelLevel = results[0].fuel_level;
            lastReading.distance = results[0].distance;
            console.log('Initialized last reading from database:', lastReading);
          } else {
            console.log('No previous readings found in database');
          }
        });
      });
    });
  });
});

// API endpoints
app.post('/api/fuel-readings', (req, res) => {
  const { fuelLevel, distance } = req.body;
  
  if (fuelLevel === undefined || distance === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Check if this is the first reading or if the reading has changed
  const isFirstReading = lastReading.fuelLevel === null && lastReading.distance === null;
  const hasChanged = isFirstReading || 
                    Math.abs(lastReading.fuelLevel - fuelLevel) > 0.001 || 
                    Math.abs(lastReading.distance - distance) > 0.1;
  
  if (hasChanged) {
    // Store the new reading in the database
    const query = 'INSERT INTO fuel_readings (fuel_level, distance) VALUES (?, ?)';
    db.query(query, [fuelLevel, distance], (err, results) => {
      if (err) {
        console.error('Error inserting fuel reading:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Update the last reading
      lastReading.fuelLevel = fuelLevel;
      lastReading.distance = distance;
      
      console.log('New reading stored:', { fuelLevel, distance });
      
      res.status(201).json({ 
        id: results.insertId,
        message: 'Fuel reading saved successfully',
        isNewReading: true
      });
    });
  } else {
    // Reading hasn't changed, don't store it
    console.log('Reading unchanged, not stored:', { fuelLevel, distance });
    res.status(200).json({ 
      message: 'Fuel reading unchanged, not stored',
      isNewReading: false
    });
  }
});

app.get('/api/fuel-readings', (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  
  const query = 'SELECT * FROM fuel_readings ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  db.query(query, [parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) {
      console.error('Error fetching fuel readings:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 