/*
  ESP32 Water Quality Monitoring System
  - Reads: Temperature, TDS, Flow, Distance (Water Level), pH
  - Uploads to ThingSpeak
  - Sends SMS alerts via GSM module (optional)
  - LCD Display
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ==================== WiFi Configuration ====================
const char* ssid = "YOUR_WIFI_SSID";           // Replace with your WiFi SSID
const char* password = "YOUR_WIFI_PASSWORD";    // Replace with your WiFi password

// ==================== ThingSpeak Configuration ====================
const char* THINGSPEAK_API_KEY = "E1KV6PFQTL5WZSDB";  // Your Write API Key
const char* THINGSPEAK_URL = "http://api.thingspeak.com/update";

// ==================== Pin Definitions (ESP32 DevKit V1) ====================
#define DALLAS_TEMP_PIN   4    // DS18B20 Temperature sensor
#define TDS_SENSOR_PIN    34   // TDS sensor (ADC1 pin)
#define FLOW_SENSOR_PIN   27   // Flow sensor
#define TRIG_PIN          5    // Ultrasonic trigger
#define ECHO_PIN          18   // Ultrasonic echo
#define BUZZER_PIN        2    // Buzzer
#define PH_SENSOR_PIN     35   // pH sensor (ADC1 pin)

// I2C for LCD (default ESP32 I2C pins)
#define SDA_PIN           21
#define SCL_PIN           22

// GSM Module on Serial2
#define GSM_RX_PIN        16
#define GSM_TX_PIN        17

// ==================== Sensor Objects ====================
OneWire oneWire(DALLAS_TEMP_PIN);
DallasTemperature tempSensor(&oneWire);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ==================== Threshold Values ====================
// Normal ranges for water quality
const float TEMP_MIN = 20.0, TEMP_MAX = 30.0;
const float TDS_MIN = 0, TDS_MAX = 500;
const float PH_MIN = 6.5, PH_MAX = 8.5;
const int WATER_LEVEL_MIN = 20;  // Minimum safe distance in cm

// ==================== Global Variables ====================
float temperature = 0;
float tdsValue = 0;
int flowValue = 0;
float distance = 0;
float phValue = 0;

unsigned long lastUploadTime = 0;
const unsigned long UPLOAD_INTERVAL = 15000;  // 15 seconds (ThingSpeak free tier limit)

String phoneNumber = "+91XXXXXXXXXX";  // Replace with your phone number

// ==================== Function Prototypes ====================
void connectWiFi();
void readTemperature();
void readTDS();
void readFlow();
void readDistance();
void readPH();
void displayOnLCD(String line1, String line2);
void uploadToThingSpeak();
void sendSMS(String message);
bool checkAbnormal();
String getAlertMessage();

// ==================== Setup ====================
void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, GSM_RX_PIN, GSM_TX_PIN);  // GSM module
  
  // Initialize pins
  pinMode(FLOW_SENSOR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Initialize I2C for LCD
  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  
  // Initialize temperature sensor
  tempSensor.begin();
  
  // Display startup message
  displayOnLCD("Water Quality", "Monitoring v2.0");
  delay(2000);
  
  // Connect to WiFi
  connectWiFi();
  
  displayOnLCD("System Ready!", "");
  delay(1000);
  
  Serial.println("✅ ESP32 Water Quality Monitor Started!");
}

// ==================== Main Loop ====================
void loop() {
  // Read all sensors
  readTemperature();
  readTDS();
  readFlow();
  readDistance();
  readPH();
  
  // Display readings on LCD (cycle through)
  displayOnLCD("Temp: " + String(temperature, 1) + "C", 
               "TDS: " + String(tdsValue, 0) + "ppm");
  delay(2000);
  
  displayOnLCD("Flow: " + String(flowValue), 
               "Dist: " + String(distance, 1) + "cm");
  delay(2000);
  
  displayOnLCD("pH: " + String(phValue, 2), 
               checkAbnormal() ? "!! WARNING !!" : "Status: OK");
  delay(2000);
  
  // Print to Serial Monitor
  Serial.println("\n========== SENSOR READINGS ==========");
  Serial.printf("Temperature: %.2f °C\n", temperature);
  Serial.printf("TDS: %.0f ppm\n", tdsValue);
  Serial.printf("Flow: %d\n", flowValue);
  Serial.printf("Distance: %.2f cm\n", distance);
  Serial.printf("pH: %.2f\n", phValue);
  Serial.println("=====================================");
  
  // Upload to ThingSpeak (respect rate limit)
  if (millis() - lastUploadTime >= UPLOAD_INTERVAL) {
    uploadToThingSpeak();
    lastUploadTime = millis();
    
    // Check for abnormal conditions and send alert
    if (checkAbnormal()) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(500);
      digitalWrite(BUZZER_PIN, LOW);
      
      String alertMsg = getAlertMessage();
      Serial.println(alertMsg);
      // Uncomment to enable SMS alerts:
      // sendSMS(alertMsg);
    }
  }
  
  delay(1000);
}

// ==================== WiFi Connection ====================
void connectWiFi() {
  displayOnLCD("Connecting to", "WiFi...");
  Serial.print("Connecting to WiFi");
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    displayOnLCD("WiFi Connected!", WiFi.localIP().toString());
    delay(2000);
  } else {
    Serial.println("\n⚠️ WiFi Connection Failed!");
    displayOnLCD("WiFi Failed!", "Check Settings");
    delay(2000);
  }
}

// ==================== Sensor Reading Functions ====================

void readTemperature() {
  tempSensor.requestTemperatures();
  temperature = tempSensor.getTempCByIndex(0);
  
  // Handle sensor error
  if (temperature == DEVICE_DISCONNECTED_C) {
    temperature = -999;
    Serial.println("⚠️ Temperature sensor error!");
  }
}

void readTDS() {
  // ESP32 ADC is 12-bit (0-4095), voltage reference 3.3V
  int analogValue = analogRead(TDS_SENSOR_PIN);
  float voltage = analogValue * (3.3 / 4095.0);
  
  // TDS calculation (simplified formula)
  // Compensate for temperature
  float compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0);
  float compensationVoltage = voltage / compensationCoefficient;
  
  // Convert voltage to TDS value
  tdsValue = (133.42 * compensationVoltage * compensationVoltage * compensationVoltage 
              - 255.86 * compensationVoltage * compensationVoltage 
              + 857.39 * compensationVoltage) * 0.5;
  
  if (tdsValue < 0) tdsValue = 0;
}

void readFlow() {
  flowValue = digitalRead(FLOW_SENSOR_PIN);
}

void readDistance() {
  // Ultrasonic sensor reading
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // 30ms timeout
  distance = (duration * 0.0343) / 2.0;
  
  // Handle timeout/error
  if (duration == 0) {
    distance = -1;
  }
}

void readPH() {
  // ESP32 ADC reading for pH sensor
  int analogValue = analogRead(PH_SENSOR_PIN);
  float voltage = analogValue * (3.3 / 4095.0);
  
  // pH calculation (calibrate these values for your sensor)
  // Typical: pH 7 = 2.5V, pH changes ~0.18V per unit
  phValue = 7.0 + ((2.5 - voltage) / 0.18);
  
  // Clamp to valid pH range
  if (phValue < 0) phValue = 0;
  if (phValue > 14) phValue = 14;
}

// ==================== Display Function ====================
void displayOnLCD(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

// ==================== ThingSpeak Upload ====================
void uploadToThingSpeak() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi not connected. Reconnecting...");
    connectWiFi();
    return;
  }
  
  HTTPClient http;
  
  String url = String(THINGSPEAK_URL) + "?api_key=" + THINGSPEAK_API_KEY +
               "&field1=" + String(temperature, 2) +
               "&field2=" + String(flowValue) +
               "&field3=" + String(tdsValue, 0) +
               "&field4=" + String(distance, 2) +
               "&field5=" + String(phValue, 2);
  
  Serial.println("📤 Uploading to ThingSpeak...");
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    Serial.printf("✅ ThingSpeak Response: %d\n", httpResponseCode);
    displayOnLCD("Data Uploaded!", "ThingSpeak OK");
  } else {
    Serial.printf("⚠️ ThingSpeak Error: %d\n", httpResponseCode);
    displayOnLCD("Upload Failed!", "Check Connection");
  }
  
  http.end();
  delay(1000);
}

// ==================== Abnormal Condition Check ====================
bool checkAbnormal() {
  bool abnormal = false;
  
  // Temperature check
  if (temperature != -999 && (temperature < TEMP_MIN || temperature > TEMP_MAX)) {
    abnormal = true;
  }
  
  // TDS check
  if (tdsValue > TDS_MAX) {
    abnormal = true;
  }
  
  // pH check
  if (phValue < PH_MIN || phValue > PH_MAX) {
    abnormal = true;
  }
  
  // Water level check (distance > threshold means low water)
  if (distance > 0 && distance < WATER_LEVEL_MIN) {
    abnormal = true;
  }
  
  return abnormal;
}

String getAlertMessage() {
  String msg = "⚠️ ALERT: Abnormal Water Condition!\n";
  
  if (temperature != -999 && (temperature < TEMP_MIN || temperature > TEMP_MAX)) {
    msg += "Temp: " + String(temperature, 1) + "°C (Abnormal)\n";
  }
  if (tdsValue > TDS_MAX) {
    msg += "TDS: " + String(tdsValue, 0) + "ppm (High)\n";
  }
  if (phValue < PH_MIN || phValue > PH_MAX) {
    msg += "pH: " + String(phValue, 2) + " (Abnormal)\n";
  }
  if (distance > 0 && distance < WATER_LEVEL_MIN) {
    msg += "Water Level: LOW\n";
  }
  
  return msg;
}

// ==================== SMS Function (GSM Module) ====================
void sendSMS(String message) {
  Serial.println("📲 Sending SMS Alert...");
  
  Serial2.println("AT+CMGF=1");  // Set SMS to text mode
  delay(1000);
  
  Serial2.println("AT+CMGS=\"" + phoneNumber + "\"");
  delay(1000);
  
  Serial2.println(message);
  delay(100);
  
  Serial2.write(26);  // Ctrl+Z to send
  delay(3000);
  
  Serial.println("✅ SMS Sent!");
}
