#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "your-router-ssid";
const char* password = "your-router-password";

// Create WebServer instance on port 80
WebServer server(80);

// Simulation parameters
const float MIN_FUEL_LEVEL = 10.0;  // Minimum simulated fuel level
const float MAX_FUEL_LEVEL = 50.0;  // Maximum simulated fuel level
const float FUEL_CONSUMPTION_RATE = 0.1;  // Liters per minute consumption rate

// Variables for simulation
float currentFuelLevel = MAX_FUEL_LEVEL;
unsigned long lastUpdateTime = 0;
const unsigned long UPDATE_INTERVAL = 3 * 60 * 1000; // 5 minutes in milliseconds

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Setup routes
  server.on("/fuel-level", HTTP_GET, handleFuelLevel);
  server.on("/", HTTP_GET, handleRoot);
  
  // Add CORS headers to all responses
  server.onNotFound([]() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(404, "text/plain", "Not Found");
  });
  
  // Start server
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
  
  // Update simulated fuel level every 5 minutes
  if (millis() - lastUpdateTime >= UPDATE_INTERVAL) {
    updateSimulatedFuelLevel();
    lastUpdateTime = millis();
  }
}

void updateSimulatedFuelLevel() {
  // Simulate fuel consumption
  currentFuelLevel -= (FUEL_CONSUMPTION_RATE * 5); // 5 minutes worth of consumption
  
  // If fuel level goes below minimum, reset to maximum
  if (currentFuelLevel < MIN_FUEL_LEVEL) {
    currentFuelLevel = MAX_FUEL_LEVEL;
  }
  
  // Print debug information
  Serial.print("Simulated Fuel Level: ");
  Serial.print(currentFuelLevel);
  Serial.println("L");
}

void handleFuelLevel() {
  // Add CORS headers
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // Handle OPTIONS request for CORS preflight
  if (server.method() == HTTP_OPTIONS) {
    server.send(200);
    return;
  }

  // Create JSON response
  StaticJsonDocument<200> doc;
  doc["fuelLevel"] = currentFuelLevel;
  doc["timestamp"] = millis();
  doc["unit"] = "liters";
  doc["isSimulated"] = true;
  
  String response;
  serializeJson(doc, response);
  
  // Send response
  server.send(200, "application/json", response);
}

void handleRoot() {
  // Add CORS headers
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");

  String html = "<!DOCTYPE html><html><head><title>ESP32 Fuel Monitor</title>";
  html += "<style>body{font-family:Arial;text-align:center;margin-top:50px}</style>";
  html += "</head><body>";
  html += "<h1>ESP32 Fuel Monitoring System</h1>";
  html += "<p>Current Fuel Level: " + String(currentFuelLevel) + " liters</p>";
  html += "<p>Last Updated: " + String(millis() - lastUpdateTime) + " ms ago</p>";
  html += "<p>Note: This is simulated data</p>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
} 
