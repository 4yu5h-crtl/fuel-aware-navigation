# 🚗 Fuel-Aware Navigation System

A smart navigation system that optimizes routes based on real-time fuel levels, helping you reach your destination efficiently while avoiding running out of fuel.

[Project Demo](yet to come)

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
