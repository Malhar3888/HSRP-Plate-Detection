# Python Backend for Live HSRP Detection

This document provides complete Python backend code for the real-time HSRP detection system.

## Architecture

```
Frontend (React) → WebSocket → FastAPI Backend → AI Pipeline → Response
```

## Tech Stack

- **FastAPI**: Web framework with WebSocket support
- **YOLOv8**: Vehicle and plate detection
- **EasyOCR**: Number plate text recognition
- **TensorFlow/PyTorch**: HSRP CNN classifier
- **OpenCV**: Image processing
- **WebSockets**: Real-time communication

## Installation

### 1. Create Python Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install fastapi uvicorn websockets
pip install ultralytics  # YOLOv8
pip install easyocr
pip install opencv-python
pip install pillow
pip install numpy
pip install torch torchvision  # For CNN model
```

## Backend Code

### File Structure

```
backend/
├── main.py                 # FastAPI server
├── models/
│   ├── vehicle_detector.py    # YOLOv8 vehicle detection
│   ├── plate_detector.py      # YOLOv8 plate detection
│   ├── ocr_engine.py          # EasyOCR integration
│   └── hsrp_classifier.py     # CNN HSRP classifier
├── weights/
│   ├── yolov8n.pt            # Vehicle detection weights
│   ├── plate_yolov8.pt       # Plate detection weights
│   └── hsrp_cnn.pth          # HSRP classifier weights
└── utils/
    └── image_processing.py    # Helper functions
```

### main.py - FastAPI Server

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import base64
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import json
import asyncio

from models.vehicle_detector import VehicleDetector
from models.plate_detector import PlateDetector
from models.ocr_engine import OCREngine
from models.hsrp_classifier import HSRPClassifier

app = FastAPI(title="HSRP Detection API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI models
vehicle_detector = VehicleDetector("weights/yolov8n.pt")
plate_detector = PlateDetector("weights/plate_yolov8.pt")
ocr_engine = OCREngine()
hsrp_classifier = HSRPClassifier("weights/hsrp_cnn.pth")

def decode_base64_image(base64_string):
    """Convert base64 string to OpenCV image"""
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    # Decode base64
    img_data = base64.b64decode(base64_string)
    img = Image.open(BytesIO(img_data))
    
    # Convert to OpenCV format
    img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    return img_cv

async def process_frame(frame):
    """
    Process a single frame through the AI pipeline
    
    Pipeline:
    1. Detect vehicles (YOLOv8)
    2. Detect number plates (YOLOv8)
    3. Extract text (OCR)
    4. Classify HSRP (CNN)
    """
    results = []
    
    # Step 1: Detect vehicles
    vehicles = vehicle_detector.detect(frame)
    
    for vehicle in vehicles:
        x1, y1, x2, y2 = vehicle['bbox']
        vehicle_crop = frame[y1:y2, x1:x2]
        
        # Step 2: Detect plates in vehicle region
        plates = plate_detector.detect(vehicle_crop)
        
        for plate in plates:
            px1, py1, px2, py2 = plate['bbox']
            plate_crop = vehicle_crop[py1:py2, px1:px2]
            
            # Step 3: OCR - Extract plate number
            plate_text = ocr_engine.read_plate(plate_crop)
            
            # Step 4: HSRP Classification
            hsrp_status, confidence = hsrp_classifier.classify(plate_crop)
            
            # Calculate absolute bounding box coordinates (normalized)
            h, w = frame.shape[:2]
            abs_x1 = (x1 + px1) / w
            abs_y1 = (y1 + py1) / h
            abs_x2 = (x1 + px2) / w
            abs_y2 = (y1 + py2) / h
            
            result = {
                'plate_number': plate_text,
                'hsrp_status': 'valid' if hsrp_status else 'invalid',
                'confidence': float(confidence * 100),
                'bounding_box': {
                    'x': float(abs_x1),
                    'y': float(abs_y1),
                    'width': float(abs_x2 - abs_x1),
                    'height': float(abs_y2 - abs_y1)
                }
            }
            
            results.append(result)
    
    return results

@app.websocket("/ws/detect")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time detection"""
    await websocket.accept()
    print("Client connected")
    
    try:
        while True:
            # Receive frame from frontend
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Decode base64 frame
            frame_base64 = message.get('frame', '')
            frame = decode_base64_image(frame_base64)
            
            # Process frame through AI pipeline
            detections = await process_frame(frame)
            
            # Send results back to frontend
            if detections:
                for detection in detections:
                    await websocket.send_json(detection)
                    await asyncio.sleep(0.1)  # Small delay between detections
            
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

@app.get("/")
async def root():
    return {"message": "HSRP Detection API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models": {
            "vehicle_detector": "loaded",
            "plate_detector": "loaded",
            "ocr_engine": "loaded",
            "hsrp_classifier": "loaded"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### models/vehicle_detector.py - YOLOv8 Vehicle Detection

```python
from ultralytics import YOLO
import cv2

class VehicleDetector:
    def __init__(self, model_path):
        """Initialize YOLOv8 vehicle detector"""
        self.model = YOLO(model_path)
        self.vehicle_classes = ['car', 'motorcycle', 'bus', 'truck']
    
    def detect(self, frame):
        """
        Detect vehicles in frame
        
        Returns:
            List of detected vehicles with bounding boxes
        """
        results = self.model(frame, conf=0.5)
        vehicles = []
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Get class name
                cls = int(box.cls[0])
                class_name = self.model.names[cls]
                
                # Filter only vehicles
                if class_name in self.vehicle_classes:
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0])
                    
                    vehicles.append({
                        'bbox': [int(x1), int(y1), int(x2), int(y2)],
                        'confidence': confidence,
                        'class': class_name
                    })
        
        return vehicles
```

### models/plate_detector.py - YOLOv8 Plate Detection

```python
from ultralytics import YOLO

class PlateDetector:
    def __init__(self, model_path):
        """Initialize YOLOv8 plate detector"""
        # You need to train this model on Indian number plate dataset
        self.model = YOLO(model_path)
    
    def detect(self, frame):
        """
        Detect number plates in frame
        
        Returns:
            List of detected plates with bounding boxes
        """
        results = self.model(frame, conf=0.6)
        plates = []
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0])
                
                plates.append({
                    'bbox': [int(x1), int(y1), int(x2), int(y2)],
                    'confidence': confidence
                })
        
        return plates
```

### models/ocr_engine.py - EasyOCR Integration

```python
import easyocr
import re

class OCREngine:
    def __init__(self):
        """Initialize EasyOCR reader"""
        self.reader = easyocr.Reader(['en'], gpu=True)
    
    def read_plate(self, plate_image):
        """
        Extract text from number plate image
        
        Returns:
            Cleaned plate number string
        """
        # Perform OCR
        results = self.reader.readtext(plate_image)
        
        if not results:
            return "Unknown"
        
        # Extract text with highest confidence
        text = max(results, key=lambda x: x[2])[1]
        
        # Clean and format plate number
        plate_number = self.clean_plate_text(text)
        
        return plate_number
    
    def clean_plate_text(self, text):
        """
        Clean and format Indian plate number
        Format: MH12AB1234
        """
        # Remove spaces and special characters
        text = re.sub(r'[^A-Z0-9]', '', text.upper())
        
        # Validate Indian plate format
        # Pattern: 2 letters + 2 digits + 2 letters + 4 digits
        pattern = r'^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$'
        
        if re.match(pattern, text):
            return text
        
        # Try to fix common OCR errors
        # Replace O with 0, I with 1, etc.
        text = text.replace('O', '0').replace('I', '1')
        
        return text if len(text) >= 8 else "Unknown"
```

### models/hsrp_classifier.py - CNN HSRP Classifier

```python
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import cv2

class HSRPClassifierModel(nn.Module):
    """CNN model for HSRP classification"""
    def __init__(self):
        super(HSRPClassifierModel, self).__init__()
        
        self.features = nn.Sequential(
            # Conv Block 1
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            
            # Conv Block 2
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            
            # Conv Block 3
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
        )
        
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 16 * 4, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, 2)  # Binary: HSRP or Non-HSRP
        )
    
    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

class HSRPClassifier:
    def __init__(self, model_path):
        """Initialize HSRP CNN classifier"""
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Load model
        self.model = HSRPClassifierModel()
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((128, 32)),  # Standard plate size
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                               std=[0.229, 0.224, 0.225])
        ])
    
    def classify(self, plate_image):
        """
        Classify if plate is HSRP compliant
        
        Features checked:
        - Blue IND strip on left
        - Hologram presence
        - Laser-etched code
        
        Returns:
            (is_hsrp: bool, confidence: float)
        """
        # Convert OpenCV image to PIL
        plate_rgb = cv2.cvtColor(plate_image, cv2.COLOR_BGR2RGB)
        plate_pil = Image.fromarray(plate_rgb)
        
        # Preprocess
        input_tensor = self.transform(plate_pil).unsqueeze(0).to(self.device)
        
        # Inference
        with torch.no_grad():
            output = self.model(input_tensor)
            probabilities = torch.softmax(output, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
        
        is_hsrp = bool(predicted.item() == 1)
        confidence_score = confidence.item()
        
        return is_hsrp, confidence_score
```

### utils/image_processing.py - Helper Functions

```python
import cv2
import numpy as np

def enhance_plate_image(plate_image):
    """
    Enhance plate image for better OCR
    """
    # Convert to grayscale
    gray = cv2.cvtColor(plate_image, cv2.COLOR_BGR2GRAY)
    
    # Apply bilateral filter to reduce noise
    filtered = cv2.bilateralFilter(gray, 11, 17, 17)
    
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(
        filtered, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )
    
    return thresh

def detect_blue_strip(plate_image):
    """
    Detect blue IND strip (HSRP feature)
    """
    # Convert to HSV
    hsv = cv2.cvtColor(plate_image, cv2.COLOR_BGR2HSV)
    
    # Blue color range
    lower_blue = np.array([100, 50, 50])
    upper_blue = np.array([130, 255, 255])
    
    # Create mask
    mask = cv2.inRange(hsv, lower_blue, upper_blue)
    
    # Check if blue strip exists (left side of plate)
    h, w = mask.shape
    left_region = mask[:, :int(w * 0.2)]
    blue_pixels = cv2.countNonZero(left_region)
    
    # If more than 10% pixels are blue, strip exists
    threshold = (h * int(w * 0.2)) * 0.1
    
    return blue_pixels > threshold
```

## Running the Backend

### 1. Start the Server

```bash
cd backend
python main.py
```

The server will start on `http://localhost:8000`

### 2. Test WebSocket Connection

```bash
# Install wscat for testing
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:8000/ws/detect
```

### 3. Check Health

```bash
curl http://localhost:8000/health
```

## Model Training

### YOLOv8 Plate Detection

```python
from ultralytics import YOLO

# Load pretrained model
model = YOLO('yolov8n.pt')

# Train on Indian plate dataset
model.train(
    data='plate_dataset.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    name='plate_detector'
)
```

### HSRP CNN Classifier

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from models.hsrp_classifier import HSRPClassifierModel

# Prepare dataset
# Structure:
# dataset/
#   hsrp/
#     image1.jpg
#     image2.jpg
#   non_hsrp/
#     image1.jpg
#     image2.jpg

# Training code
model = HSRPClassifierModel()
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# Training loop
for epoch in range(50):
    for images, labels in train_loader:
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

# Save model
torch.save(model.state_dict(), 'weights/hsrp_cnn.pth')
```

## Dataset Requirements

### 1. Vehicle Detection
- Use COCO dataset (already includes vehicles)
- YOLOv8 pretrained weights work well

### 2. Plate Detection
- Collect 5000+ Indian number plate images
- Annotate using LabelImg or Roboflow
- Include various angles, lighting, distances

### 3. HSRP Classification
- Collect 2000+ HSRP plates
- Collect 2000+ Non-HSRP plates
- Ensure variety in conditions

## Performance Optimization

### 1. GPU Acceleration
```python
# Use CUDA if available
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
```

### 2. Batch Processing
```python
# Process multiple frames in batch
frames_batch = [frame1, frame2, frame3]
results = model(frames_batch)
```

### 3. Model Quantization
```python
# Reduce model size and increase speed
model_quantized = torch.quantization.quantize_dynamic(
    model, {nn.Linear}, dtype=torch.qint8
)
```

## Deployment

### Docker Deployment

```dockerfile
FROM python:3.9

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build and Run

```bash
docker build -t hsrp-detection-backend .
docker run -p 8000:8000 hsrp-detection-backend
```

## Frontend Integration

Update the WebSocket URL in `LiveHSRPDetectionPage.tsx`:

```typescript
const ws = new WebSocket('ws://your-backend-url:8000/ws/detect');
```

For production, use WSS (secure WebSocket):

```typescript
const ws = new WebSocket('wss://your-backend-url/ws/detect');
```

## Troubleshooting

### Issue: Low FPS
**Solution**: Reduce image resolution before sending to backend

### Issue: Poor OCR Accuracy
**Solution**: Enhance image preprocessing, use better OCR model

### Issue: False HSRP Detection
**Solution**: Collect more training data, fine-tune CNN model

### Issue: WebSocket Disconnects
**Solution**: Implement reconnection logic, add heartbeat

## Next Steps

1. Collect and annotate datasets
2. Train YOLOv8 plate detector
3. Train HSRP CNN classifier
4. Deploy backend to cloud (AWS, GCP, Azure)
5. Set up HTTPS and WSS
6. Implement caching and optimization
7. Add monitoring and logging

## Resources

- YOLOv8 Documentation: https://docs.ultralytics.com/
- EasyOCR: https://github.com/JaidedAI/EasyOCR
- FastAPI: https://fastapi.tiangolo.com/
- PyTorch: https://pytorch.org/

---

**Note**: This backend requires significant computational resources. For production, use GPU-enabled servers (AWS EC2 with GPU, Google Cloud GPU instances, etc.)
