# 🚗 Fuel-Aware Navigation System

This project combines an ESP32-based fuel monitoring system with a web application for fuel-efficient route planning.

## 🌟 Features

- **Real-time Fuel Monitoring**: Integrates with ESP32 and fuel sensors to track fuel levels
- **Smart Route Optimization**: Calculates routes based on current fuel levels and consumption rates
- **Multiple Route Options**: Provides alternative routes based on fuel efficiency
- **Automatic Location Detection**: Uses browser geolocation for quick start
- **Refueling Alerts**: Notifies you when you need to refuel
- **Interactive Map Interface**: Clean and intuitive Google Maps integration
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React.js with Material-UI
- **Maps**: Google Maps JavaScript API
- **Hardware Integration**: ESP32 microcontroller
- **Real-time Updates**: WebSocket communication
- **Styling**: CSS Modules for component-specific styles

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Maps API key
- ESP32 microcontroller with fuel sensor

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fuel-aware-navigation.git
cd fuel-aware-navigation
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Google Maps API key:
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## 🔧 Hardware Setup

1. Connect the fuel sensor to your ESP32
2. Upload the provided Arduino sketch to the ESP32
3. Ensure the ESP32 is connected to the same network as your computer
4. The application will automatically detect and connect to the ESP32

## 📱 How to Use

1. **Start Navigation**:
   - Enter your destination in the search bar
   - The system will automatically detect your current location
   - View multiple route options based on fuel efficiency

2. **Monitor Fuel Levels**:
   - Real-time fuel level updates are displayed on the map
   - Receive alerts when fuel levels are low
   - View estimated range based on current fuel levels

3. **Route Optimization**:
   - Choose between fastest, most fuel-efficient, or balanced routes
   - View estimated fuel consumption for each route
   - Get real-time updates on fuel levels during navigation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

## System Components

1. **ESP32 Fuel Monitor**: Uses an ultrasonic sensor to measure fuel levels in a bottle and sends data to a server.
2. **Node.js Server**: Receives fuel readings from the ESP32 and stores them in a MySQL database.
3. **React Web Application**: Displays fuel level history and provides route planning based on fuel efficiency.

## Setup Instructions

### 1. ESP32 Setup

1. Install the required libraries in Arduino IDE:
   - WiFi.h
   - WebServer.h
   - ArduinoJson.h
   - HTTPClient.h

2. Update the WiFi credentials and server URL in `fuel_efficiency.ino`:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* serverUrl = "http://YOUR_SERVER_IP:3001";
   ```

3. Upload the code to your ESP32.

### 2. MySQL Database Setup

1. Install MySQL Server on your computer.
2. Create a database named `fuel_monitor`:
   ```sql
   CREATE DATABASE fuel_monitor;
   ```

3. The server will automatically create the required table when it starts.

### 3. Node.js Server Setup

1. Navigate to the server directory:
   ```
   cd fuel-aware-navigation/server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Update the MySQL connection details in `server.js` if needed:
   ```javascript
   const db = mysql.createConnection({
     host: 'localhost',
     user: 'root',
     password: 'YOUR_MYSQL_PASSWORD',
     database: 'fuel_monitor'
   });
   ```

4. Start the server:
   ```
   npm start
   ```

### 4. React Web Application Setup

1. Navigate to the project directory:
   ```
   cd fuel-aware-navigation
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. The ESP32 will automatically measure fuel levels every 30 seconds and send the data to the server.
2. The server will only store readings in the database when the fuel level or distance changes, avoiding duplicate entries.
3. The web application will display the current fuel level and a history of fuel readings.
4. Use the Map tab to plan routes based on fuel efficiency.
5. Use the Fuel History tab to view historical fuel level data.

## Troubleshooting

- If the ESP32 cannot connect to the server, check the WiFi credentials and server URL.
- If the server cannot connect to the MySQL database, check the database credentials.
- If the web application cannot fetch data from the server, check that the server is running and the API endpoints are correct.
