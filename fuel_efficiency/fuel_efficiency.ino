#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

// WiFi credentials
const char* ssid = "JioFiber-5G";
const char* password = "123456789";

// Server details
const char* serverUrl = "http://192.168.29.153:3001"; // Change this to your server's IP address

// Create WebServer instance on port 80
WebServer server(80);

// Ultrasonic sensor pins
const int TRIG_PIN = 5;  // ESP32 GPIO pin for trigger
const int ECHO_PIN = 18; // ESP32 GPIO pin for echo

// Bottle dimensions (in cm)
const float BOTTLE_HEIGHT = 15.9;  // Height of the bottle (calculated from volume and diameter)
const float BOTTLE_DIAMETER = 6.0; // Diameter of the bottle
const float BOTTLE_VOLUME = 0.45;  // Total volume of the bottle in liters (450ml)

// Calibration parameters
const float EMPTY_DISTANCE = 10.0;   // Distance when bottle is empty (in cm)
const float FULL_DISTANCE = 2.0;     // Distance when bottle is full (in cm)

// Variables for sensor readings
float currentFuelLevel = 0.0;
float currentDistance = 0.0;
unsigned long lastUpdateTime = 0;
const unsigned long UPDATE_INTERVAL = 0.5 * 60 * 1000; // 30 seconds in milliseconds

void setup() {
  Serial.begin(115200);
  
  // Initialize ultrasonic sensor pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
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
  
  // Update fuel level every 30 seconds
  if (millis() - lastUpdateTime >= UPDATE_INTERVAL) {
    updateFuelLevel();
    lastUpdateTime = millis();
    
    // Send data to server
    sendDataToServer();
  }
}

float measureDistance() {
  // Clear the TRIG_PIN
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  
  // Set the TRIG_PIN HIGH for 10 microseconds
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read the ECHO_PIN, return the sound wave travel time in microseconds
  long duration = pulseIn(ECHO_PIN, HIGH);
  
  // Calculate the distance
  float distance = duration * 0.034 / 2;
  
  return distance;
}

void updateFuelLevel() {
  // Take multiple readings and average them for stability
  float totalDistance = 0;
  const int NUM_READINGS = 5;
  
  for (int i = 0; i < NUM_READINGS; i++) {
    totalDistance += measureDistance();
    delay(100); // Small delay between readings
  }
  
  float averageDistance = totalDistance / NUM_READINGS;
  currentDistance = averageDistance;
  
  // Convert distance to fuel level (in liters)
  // Linear interpolation between empty and full distances
  float fuelPercentage = 0;
  
  if (averageDistance >= EMPTY_DISTANCE) {
    fuelPercentage = 0; // Empty when distance is greater than or equal to EMPTY_DISTANCE
  } else if (averageDistance <= FULL_DISTANCE) {
    fuelPercentage = 100; // Full when distance is less than or equal to FULL_DISTANCE
  } else {
    // Linear interpolation for distances between EMPTY_DISTANCE and FULL_DISTANCE
    fuelPercentage = 100.0 * (EMPTY_DISTANCE - averageDistance) / (EMPTY_DISTANCE - FULL_DISTANCE);
  }
  
  // Calculate fuel level in liters
  currentFuelLevel = (fuelPercentage / 100.0) * BOTTLE_VOLUME;
  
  // Print debug information
  Serial.print("Distance: ");
  Serial.print(averageDistance);
  Serial.print(" cm, Fuel Level: ");
  Serial.print(currentFuelLevel);
  Serial.println(" L");
}

void sendDataToServer() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Prepare the URL
    String url = String(serverUrl) + "/api/fuel-readings";
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["fuelLevel"] = currentFuelLevel;
    doc["distance"] = currentDistance;
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    // Begin HTTP connection
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    // Send POST request
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
      
      // Parse the response to check if the reading was stored
      StaticJsonDocument<200> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);
      
      if (!error) {
        bool isNewReading = responseDoc["isNewReading"] | false;
        if (isNewReading) {
          Serial.println("New reading stored in database");
        } else {
          Serial.println("Reading unchanged, not stored in database");
        }
      }
    } else {
      Serial.println("Error sending data: " + String(httpResponseCode));
    }
    
    // Free resources
    http.end();
  } else {
    Serial.println("WiFi not connected. Cannot send data to server.");
  }
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
  doc["distance"] = currentDistance;
  doc["timestamp"] = millis();
  doc["unit"] = "liters";
  doc["isSimulated"] = false;
  
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
  html += "<p>Current Distance: " + String(currentDistance) + " cm</p>";
  html += "<p>Last Updated: " + String(millis() - lastUpdateTime) + " ms ago</p>";
  html += "<p>Note: This is real data from ultrasonic sensor</p>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
} 