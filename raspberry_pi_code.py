import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import serial
import time
import warnings
import requests

warnings.filterwarnings("ignore")

# ------------------- SERIAL SETUP -------------------
ser = serial.Serial('/dev/serial0', baudrate=9600, timeout=1)
time.sleep(2)
print("✅ Serial connection to Arduino opened successfully!")

# GSM module (optional - uncomment if using)
# gsm = serial.Serial('/dev/serial0', baudrate=9600, timeout=1)
# time.sleep(2)
# print("📶 GSM module connected successfully!")

# ------------------- THINGSPEAK CONFIG -------------------
THINGSPEAK_WRITE_API_KEY = "GO0S6KBJQ5XT1CO9"  # Your Write API Key
THINGSPEAK_READ_API_KEY = "QMYHJHS1WF9DP8FR"   # Your Read API Key (for reference)
THINGSPEAK_URL = "https://api.thingspeak.com/update"

def upload_to_thingspeak(temp, flow, tds, distance, ph):
    """
    Upload sensor data to ThingSpeak
    Field mapping:
    - field1: Temperature (°C)
    - field2: Flow (0 or 1)
    - field3: TDS (ppm)
    - field4: Distance/Water Level (cm)
    - field5: pH
    """
    data = {
        'api_key': THINGSPEAK_WRITE_API_KEY,
        'field1': temp,
        'field2': flow,
        'field3': tds,
        'field4': distance,
        'field5': ph
    }
    try:
        response = requests.post(THINGSPEAK_URL, data=data, timeout=5)
        if response.status_code == 200 and response.text != '0':
            print(f"✅ Data uploaded to ThingSpeak! Entry: {response.text}")
            return True
        else:
            print(f"⚠️ ThingSpeak upload failed. Response: {response.text}")
            return False
    except Exception as e:
        print("⚠️ Error uploading to ThingSpeak:", e)
        return False

# ------------------- LOAD TRAINING DATA -------------------
print("📊 Loading training data...")
data = pd.read_excel("water_quality3.xlsx", engine="openpyxl")

# Feature columns
feature_temp = data['temperature']
feature_flow = data['flow']
feature_tds = data['tds']
feature_distance = data['distance']
feature_ph = data['ph']

# Label columns (0 = normal, 1 = abnormal)
label_temp = data['label_temp']
label_flow = data['label_flow']
label_tds = data['label_tds']
label_distance = data['label_distance']
label_ph = data['label_ph']

# ------------------- SPLIT DATA -------------------
X_train_temp, X_test_temp, y_train_temp, y_test_temp = train_test_split(feature_temp, label_temp, test_size=0.2, random_state=42)
X_train_flow, X_test_flow, y_train_flow, y_test_flow = train_test_split(feature_flow, label_flow, test_size=0.2, random_state=42)
X_train_tds, X_test_tds, y_train_tds, y_test_tds = train_test_split(feature_tds, label_tds, test_size=0.2, random_state=42)
X_train_distance, X_test_distance, y_train_distance, y_test_distance = train_test_split(feature_distance, label_distance, test_size=0.2, random_state=42)
X_train_ph, X_test_ph, y_train_ph, y_test_ph = train_test_split(feature_ph, label_ph, test_size=0.2, random_state=42)

# ------------------- TRAIN RANDOM FOREST MODELS -------------------
print("🌲 Training Random Forest models...")

rf_temp = RandomForestClassifier(random_state=42)
rf_temp.fit(X_train_temp.values.reshape(-1,1), y_train_temp)

rf_flow = RandomForestClassifier(random_state=42)
rf_flow.fit(X_train_flow.values.reshape(-1,1), y_train_flow)

rf_tds = RandomForestClassifier(random_state=42)
rf_tds.fit(X_train_tds.values.reshape(-1,1), y_train_tds)

rf_distance = RandomForestClassifier(random_state=42)
rf_distance.fit(X_train_distance.values.reshape(-1,1), y_train_distance)

rf_ph = RandomForestClassifier(random_state=42)
rf_ph.fit(X_train_ph.values.reshape(-1,1), y_train_ph)

print("✅ Models trained successfully!")

# ------------------- READ SERIAL DATA FROM ARDUINO -------------------
def readData():
    """
    Read and parse sensor data from Arduino
    Expected format: a<temp>b<flow>c<tds>d<distance>e<ph>f
    """
    serial_data = ser.readline().decode(errors='ignore').strip()
    
    # Wait for valid data starting with 'a'
    timeout_counter = 0
    while not serial_data.startswith('a'):
        serial_data = ser.readline().decode(errors='ignore').strip()
        timeout_counter += 1
        if timeout_counter > 50:  # ~5 second timeout
            print("⚠️ Timeout waiting for Arduino data")
            return None

    print("\n" + "="*40)
    print("   📥 Data Received from Arduino")
    print("="*40)
    print(f"Raw Data: {serial_data}")

    try:
        # Parse the data string
        a = serial_data.find("a") + 1
        b = serial_data.find("b")
        temp = float(serial_data[a:b])

        b = serial_data.find("b") + 1
        c = serial_data.find("c")
        flow = float(serial_data[b:c])

        c = serial_data.find("c") + 1
        d = serial_data.find("d")
        tds = float(serial_data[c:d])

        d = serial_data.find("d") + 1
        e = serial_data.find("e")
        distance = float(serial_data[d:e])

        e = serial_data.find("e") + 1
        f = serial_data.find("f")
        ph = float(serial_data[e:f])

        print(f"🌡️ Temperature: {temp} °C")
        print(f"💧 Flow: {flow} ({'Flowing' if flow == 1 else 'No Flow'})")
        print(f"🧪 TDS: {tds} ppm")
        print(f"📏 Distance: {distance} cm")
        print(f"⚗️ pH: {ph}")
        print("="*40)

        return temp, flow, tds, distance, ph

    except Exception as e:
        print(f"⚠️ Data parsing error: {e}")
        return None

# ------------------- SEND SMS (OPTIONAL) -------------------
def send_sms(message, phone_number="+91XXXXXXXXXX"):
    """Send SMS alert via GSM module"""
    try:
        gsm = serial.Serial('/dev/serial0', baudrate=9600, timeout=1)
        print("\n📲 Sending SMS Alert...")
        gsm.write(b'AT+CMGF=1\r')
        time.sleep(1)
        gsm.write(f'AT+CMGS="{phone_number}"\r'.encode())
        time.sleep(1)
        gsm.write(message.encode() + b"\r")
        gsm.write(bytes([26]))  # Ctrl+Z to send
        time.sleep(3)
        gsm.close()
        print("✅ SMS Sent Successfully!")
    except Exception as e:
        print(f"⚠️ SMS sending failed: {e}")

# ------------------- MAIN LOOP -------------------
print("\n🚀 Starting main monitoring loop...")
print("Press Ctrl+C to stop\n")

while True:
    try:
        # Read sensor data from Arduino
        input_data = readData()
        if input_data is None:
            print("⏳ Waiting for valid data...")
            time.sleep(2)
            continue

        temp, flow, tds, distance, ph = input_data

        # Upload to ThingSpeak
        upload_to_thingspeak(temp, flow, tds, distance, ph)

        # Random Forest predictions (0 = normal, 1 = abnormal)
        pred_temp = rf_temp.predict([[temp]])[0]
        pred_flow = rf_flow.predict([[flow]])[0]
        pred_tds = rf_tds.predict([[tds]])[0]
        pred_distance = rf_distance.predict([[distance]])[0]
        pred_ph = rf_ph.predict([[ph]])[0]

        # Print prediction results
        print("\n📊 ML Predictions:")
        print(f"  Temperature: {'⚠️ ABNORMAL' if pred_temp == 1 else '✅ Normal'}")
        print(f"  Flow: {'⚠️ ABNORMAL' if pred_flow == 1 else '✅ Normal'}")
        print(f"  TDS: {'⚠️ ABNORMAL' if pred_tds == 1 else '✅ Normal'}")
        print(f"  Distance: {'⚠️ ABNORMAL' if pred_distance == 1 else '✅ Normal'}")
        print(f"  pH: {'⚠️ ABNORMAL' if pred_ph == 1 else '✅ Normal'}")

        # Alert if any abnormal condition detected
        if pred_temp == 1 or pred_flow == 1 or pred_tds == 1 or pred_distance == 1 or pred_ph == 1:
            print("\n🚨 ALERT: Abnormal Water Condition Detected!")
            alert_msg = (
                "⚠️ WATER QUALITY ALERT!\n"
                f"Temp: {temp}°C | Flow: {flow} | "
                f"TDS: {tds}ppm | Dist: {distance}cm | pH: {ph}"
            )
            # Uncomment to enable SMS alerts:
            # send_sms(alert_msg)
        else:
            print("\n✅ All parameters within normal range.")

        # Wait for ThingSpeak rate limit (15 seconds for free tier)
        print("\n⏱️ Waiting 15 seconds before next reading...")
        time.sleep(15)

    except KeyboardInterrupt:
        print("\n\n🛑 Program stopped by user.")
        break
    except Exception as e:
        print(f"\n⚠️ Error in main loop: {e}")
        time.sleep(5)

# Cleanup
ser.close()
print("👋 Serial connection closed. Goodbye!")
