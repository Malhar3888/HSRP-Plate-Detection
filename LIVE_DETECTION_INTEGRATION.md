# Live HSRP Detection - Integration Guide

## Overview

The Live HSRP Detection feature allows users to point their laptop camera at a vehicle number plate and get instant AI-powered analysis of HSRP compliance.

## System Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React Frontend│         │  WebSocket       │         │  Python Backend │
│   (Browser)     │◄───────►│  Connection      │◄───────►│  (FastAPI)      │
│                 │         │                  │         │                 │
│  - Webcam       │         │  - Frame Stream  │         │  - YOLOv8       │
│  - Video Display│         │  - JSON Messages │         │  - OCR          │
│  - UI Overlay   │         │                  │         │  - CNN HSRP     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Current Status

### ✅ Completed (Frontend)

1. **Webcam Access**
   - WebRTC/getUserMedia() implementation
   - Camera permission handling
   - Video stream display
   - Frame capture at 10-15 FPS

2. **User Interface**
   - Live video preview
   - Detection overlay with bounding boxes
   - Real-time status indicators
   - Detection history log
   - Screenshot capture
   - FPS counter
   - System status panel

3. **WebSocket Client**
   - Connection management
   - Frame streaming
   - Result handling
   - Auto-reconnection logic
   - Error handling

4. **Demo Mode**
   - Simulated detections for testing
   - Random plate generation
   - Confidence scoring
   - Bounding box visualization

### ⏳ Pending (Backend)

1. **Python Backend Setup**
   - FastAPI server
   - WebSocket endpoint
   - AI model loading

2. **AI Models**
   - YOLOv8 vehicle detection
   - YOLOv8 plate detection
   - EasyOCR integration
   - HSRP CNN classifier

3. **Model Training**
   - Collect datasets
   - Train plate detector
   - Train HSRP classifier

## How to Use (Current Demo Mode)

### 1. Access the Feature

1. Login to the system
2. Navigate to **"Live HSRP Detection"** from the sidebar
3. Click **"Start Camera"** button
4. Allow camera permissions when prompted

### 2. Test Detection

- The system runs in demo mode
- Simulated detections appear randomly every 2-3 seconds
- Bounding boxes show detected plate regions
- Detection results display:
  - Plate number (e.g., MH12AB1234)
  - HSRP status (Valid/Invalid)
  - Confidence percentage

### 3. Capture Screenshots

- Click **"Screenshot"** button to save current frame
- Screenshot includes detection overlay
- Downloads automatically to your device

### 4. View Detection Log

- Right panel shows detection history
- Displays last 20 detections
- Shows timestamp, plate number, status, confidence

## Backend Integration Steps

### Step 1: Set Up Python Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn websockets
pip install ultralytics easyocr opencv-python
pip install torch torchvision pillow numpy
```

### Step 2: Download Backend Code

The complete backend code is provided in `BACKEND_GUIDE.md`. Copy the code to create:

```
backend/
├── main.py
├── models/
│   ├── vehicle_detector.py
│   ├── plate_detector.py
│   ├── ocr_engine.py
│   └── hsrp_classifier.py
├── weights/
│   ├── yolov8n.pt
│   ├── plate_yolov8.pt
│   └── hsrp_cnn.pth
└── utils/
    └── image_processing.py
```

### Step 3: Download Model Weights

```bash
# YOLOv8 vehicle detection (pretrained)
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt

# Plate detector - needs training (see BACKEND_GUIDE.md)
# HSRP classifier - needs training (see BACKEND_GUIDE.md)
```

### Step 4: Start Backend Server

```bash
cd backend
python main.py
```

Server starts on `http://localhost:8000`

### Step 5: Update Frontend Configuration

In `LiveHSRPDetectionPage.tsx`, the WebSocket URL is already configured:

```typescript
const ws = new WebSocket('ws://localhost:8000/ws/detect');
```

For production, update to your backend URL:

```typescript
const ws = new WebSocket('wss://your-backend-domain.com/ws/detect');
```

### Step 6: Disable Demo Mode

Once backend is running, the frontend will automatically:
1. Attempt WebSocket connection
2. If successful, disable demo mode
3. Start sending real frames
4. Display real AI detections

## AI Pipeline Flow

```
1. Frontend captures frame from webcam (12 FPS)
   ↓
2. Convert frame to base64 JPEG
   ↓
3. Send via WebSocket to backend
   ↓
4. Backend decodes image
   ↓
5. YOLOv8 detects vehicles
   ↓
6. YOLOv8 detects plates in vehicle regions
   ↓
7. EasyOCR extracts plate text
   ↓
8. CNN classifies HSRP compliance
   ↓
9. Send results back to frontend
   ↓
10. Frontend displays overlay and logs detection
```

## Model Training Requirements

### 1. Plate Detection Dataset

**Requirements:**
- 5,000+ images of Indian number plates
- Various angles (front, side, tilted)
- Different lighting conditions
- Multiple distances
- Annotated with bounding boxes

**Tools:**
- LabelImg for annotation
- Roboflow for dataset management
- YOLOv8 for training

### 2. HSRP Classification Dataset

**Requirements:**
- 2,000+ HSRP compliant plates
- 2,000+ Non-HSRP plates
- Clear images showing:
  - Blue IND strip
  - Hologram
  - Laser-etched code

**Training:**
- Binary classification (HSRP vs Non-HSRP)
- CNN architecture provided in BACKEND_GUIDE.md
- 50-100 epochs recommended

## Performance Optimization

### Frontend Optimization

1. **Frame Rate Control**
   - Currently: 12 FPS
   - Adjustable in code: `1000 / 12` (line 162)
   - Lower FPS = less bandwidth, slower detection
   - Higher FPS = more bandwidth, faster detection

2. **Image Quality**
   - Currently: JPEG quality 0.8
   - Adjustable in code: `toDataURL('image/jpeg', 0.8)`
   - Lower quality = smaller size, faster transfer
   - Higher quality = better accuracy, slower transfer

### Backend Optimization

1. **GPU Acceleration**
   - Use CUDA-enabled GPU
   - 10-20x faster than CPU
   - Required for real-time processing

2. **Model Optimization**
   - Use YOLOv8n (nano) for speed
   - Quantize models for faster inference
   - Batch processing if multiple cameras

3. **Caching**
   - Cache OCR results for similar plates
   - Reduce redundant processing

## Troubleshooting

### Camera Not Working

**Issue**: "Failed to access camera"

**Solutions:**
1. Check browser permissions
2. Ensure HTTPS (required for camera access)
3. Try different browser (Chrome recommended)
4. Check if camera is in use by another app

### WebSocket Connection Failed

**Issue**: "Backend connection failed"

**Solutions:**
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check firewall settings
3. Ensure correct WebSocket URL
4. Check browser console for errors

### Low FPS

**Issue**: Frame rate drops below 10 FPS

**Solutions:**
1. Reduce video resolution
2. Lower JPEG quality
3. Upgrade backend server (more CPU/GPU)
4. Optimize AI models

### Poor Detection Accuracy

**Issue**: Incorrect plate numbers or HSRP status

**Solutions:**
1. Improve lighting conditions
2. Move camera closer to plate
3. Retrain models with more data
4. Enhance image preprocessing

## Security Considerations

### 1. Camera Privacy

- Camera access requires user permission
- Video is not recorded or stored
- Frames are processed in real-time only
- No persistent storage of images

### 2. Data Transmission

- Use WSS (secure WebSocket) in production
- Encrypt sensitive data
- Implement authentication for WebSocket

### 3. Backend Security

- Add API authentication
- Rate limiting to prevent abuse
- Input validation
- CORS configuration

## Production Deployment

### Frontend Deployment

1. Build React app:
   ```bash
   npm run build
   ```

2. Deploy to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting

3. Ensure HTTPS (required for camera access)

### Backend Deployment

1. **Option 1: Cloud VM with GPU**
   - AWS EC2 (g4dn instances)
   - Google Cloud (GPU instances)
   - Azure (NC-series)

2. **Option 2: Serverless**
   - AWS Lambda (with GPU layers)
   - Google Cloud Functions
   - Limited by execution time

3. **Option 3: Container**
   - Docker + Kubernetes
   - AWS ECS/EKS
   - Google Cloud Run

### Recommended Stack

```
Frontend: Vercel (HTTPS automatic)
Backend: AWS EC2 g4dn.xlarge (GPU)
WebSocket: AWS Application Load Balancer
Database: Existing Supabase
Monitoring: CloudWatch / Datadog
```

## Cost Estimation

### Development Phase

- Frontend: Free (Vercel/Netlify)
- Backend: $0 (local development)
- Models: Free (open source)

### Production Phase

- Frontend: $0-20/month (Vercel Pro)
- Backend GPU Server: $300-500/month (AWS g4dn.xlarge)
- Bandwidth: $50-100/month (depends on usage)
- **Total: ~$400-600/month**

### Cost Optimization

1. Use spot instances (50-70% cheaper)
2. Auto-scaling (scale down when idle)
3. Edge caching
4. Optimize model size

## Next Steps

### Immediate (Week 1)

1. ✅ Frontend implementation (DONE)
2. ⏳ Set up Python backend
3. ⏳ Download YOLOv8 weights
4. ⏳ Test basic vehicle detection

### Short Term (Week 2-4)

1. Collect plate detection dataset
2. Train YOLOv8 plate detector
3. Integrate EasyOCR
4. Test end-to-end pipeline

### Medium Term (Month 2-3)

1. Collect HSRP classification dataset
2. Train CNN classifier
3. Optimize performance
4. Deploy to staging environment

### Long Term (Month 4+)

1. Production deployment
2. User testing and feedback
3. Model fine-tuning
4. Feature enhancements

## Support & Resources

### Documentation

- Frontend Code: `src/pages/LiveHSRPDetectionPage.tsx`
- Backend Guide: `BACKEND_GUIDE.md`
- User Guide: `USER_GUIDE.md`

### External Resources

- YOLOv8: https://docs.ultralytics.com/
- EasyOCR: https://github.com/JaidedAI/EasyOCR
- FastAPI: https://fastapi.tiangolo.com/
- WebRTC: https://webrtc.org/

### Getting Help

1. Check browser console for errors
2. Review backend logs
3. Test with demo mode first
4. Verify all dependencies installed

---

## Summary

✅ **Frontend**: Fully functional with demo mode  
⏳ **Backend**: Template provided, needs setup  
⏳ **AI Models**: Need training with datasets  
⏳ **Deployment**: Ready for production setup  

The system is ready for backend integration. Follow the steps in `BACKEND_GUIDE.md` to complete the AI pipeline.
