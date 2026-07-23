# Real-Time HSRP Number Plate Detection using Laptop Camera Requirements Document

## 1. Application Overview

### 1.1 Application Name\nReal-Time HSRP Number Plate Detection using Laptop Camera

### 1.2 Application Description
A real-time AI-powered web application that accesses the user's laptop webcam to detect Indian vehicle number plates and verify HSRP compliance instantly. Users can point their camera toward a bike or car number plate and receive immediate feedback on vehicle number, HSRP status, plate validity, and confidence scores with visual bounding boxes.

### 1.3 Target Users
- Traffic Police Officers
- RTO Officials
- Vehicle Owners
- General Public
- Law Enforcement Personnel

## 2. Core Functionalities

### 2.1 Webcam Access Module
- Access laptop webcam using WebRTC / getUserMedia() API
- Stream frames to backend at 10-15 FPS
- Display live camera preview in browser
- Support for multiple camera devices

### 2.2 Real-Time AI Detection Pipeline
\nProcessing flow for every frame:
```
Webcam Frame\n    ↓
YOLOv8 → Vehicle Detection\n    ↓
YOLOv8 → Number Plate Detection
    ↓
OCR (EasyOCR / PaddleOCR)
    ↓
HSRP CNN Classifier
    ↓\nResult Overlay
```\n
### 2.3 Vehicle Detection
- Real-time vehicle detection using YOLOv8\n- Detect vehicle types:
  - Cars
  - Bikes
  - Trucks
  - Buses\n\n### 2.4 Number Plate Detection
- Extract number plate regions from detected vehicles using YOLOv8
- Draw bounding boxes around detected plates
\n### 2.5 OCR Number Plate Recognition
- Extract Indian number plate text using EasyOCR or PaddleOCR
- Support Indian number plate format (e.g., MH12AB3456)
- Display detected plate number on live feed

### 2.6 HSRP Classification
- CNN model to classify HSRP vs Non-HSRP plates
- Detection criteria:
  - Blue IND band
  - Hologram presence
  - Laser-etched code
- Output classification:\n  - ✅ Valid HSRP Plate
  - ❌ Non-HSRP Plate

### 2.7 Live Output Overlay
\nDisplay on camera feed:
- Bounding box on detected number plate
- Detected plate number (e.g., MH12AB3456)
- HSRP Status:
  - ✅ Valid
  - ❌ Non-HSRP / Missing
- Confidence percentage

Example overlay format:
```
MH12AB3456
HSRP: ❌ Missing
Confidence: 92%
```

### 2.8 Detection Log
- Maintain log of all detected vehicles
- Record information:
  - Plate number
  - Timestamp
  - HSRP status
  - Confidence score
  - Screenshot\n
### 2.9 Screenshot Capture
- Capture button to save current frame
- Save detection results with overlay
- Download captured images

## 3. Technical Architecture

### 3.1 Technology Stack
\n| Layer | Technology |
|-------|------------|
| Frontend | React / HTML + JS |
| Camera | WebRTC |
| Backend | Python (FastAPI / Flask) |
| AI | YOLOv8, OpenCV |
| OCR | EasyOCR |
| HSRP Model | CNN |
| Streaming | WebSockets |
\n### 3.2 System Architecture
- Browser-based frontend with WebRTC camera access
- Backend AI processing server
- WebSocket communication for real-time frame streaming
- AI model inference pipeline

### 3.3 AI Model Components
- YOLOv8 vehicle detection model
- YOLOv8 number plate detection model
- EasyOCR / PaddleOCR engine
- CNN-based HSRP classification model\n
### 3.4 Data Requirements
- Indian number plate datasets
- HSRP vs non-HSRP image datasets
- Training data for CNN classifier

## 4. UI/UX Design Requirements

### 4.1 Web Interface Components
- Live webcam view (main display area)
- Real-time detection bounding boxes
- Status panel showing:
  - Current detection results
  - Plate number
  - HSRP status
  - Confidence score
- Detection log panel (scrollable list)
- Screenshot capture button
- Camera device selector
- Start/Stop detection controls

### 4.2 Design Style
- Clean AI camera interface
- Real-time visual feedback
- Color-coded status indicators:\n  - Green for Valid HSRP
  - Red for Non-HSRP
- Smooth animations for detection overlays
- Responsive layout\n
### 4.3 Visual Elements
- Bounding boxes with color coding
- Overlay text with high contrast
- Detection confidence bar
- Timestamp display
- Live FPS counter

## 5. Performance Requirements

### 5.1 Real-Time Processing
- Frame processing rate: 10-15 FPS
- Low latency detection (< 200ms per frame)
- Smooth camera feed display
- Instant overlay updates

### 5.2 Accuracy Requirements
- Vehicle detection accuracy: > 90%
- Number plate recognition accuracy: > 85%
- HSRP classification accuracy: > 90%
\n## 6. System Behavior

### 6.1 User Workflow
1. User opens web application
2. Grant camera access permission
3. Point laptop camera at vehicle number plate
4. AI instantly detects and analyzes plate
5. View real-time results with overlay
6. Optionally capture screenshot
7. Review detection log

### 6.2 Detection Logic
- Continuous frame analysis
- Automatic vehicle and plate detection
- Instant HSRP classification
- Real-time overlay rendering
- Automatic log entry creation

## 7. Final Deliverable

A fully working real-time webcam AI application that:
- Detects number plates from laptop camera
- Reads vehicle number using OCR
- Identifies HSRP compliance status
- Works instantly with live camera feed
- Provides visual feedback with bounding boxes and overlays
- Maintains detection log\n- Supports screenshot capture

## 8. Goal Statement

The system should behave like: **Point your laptop camera at a vehicle plate → AI instantly tells you if it is a legal HSRP or not.**