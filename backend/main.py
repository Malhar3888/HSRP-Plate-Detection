import os
import sys
import base64
import json
import asyncio
import cv2
import uuid
import numpy as np
from io import BytesIO
from PIL import Image

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Ensure the backend directory is in the system path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Gracefully detect deep learning dependencies for health reporting
try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

try:
    import easyocr
    HAS_EASYOCR = True
except ImportError:
    HAS_EASYOCR = False

try:
    from ultralytics import YOLO
    HAS_ULTRALYTICS = True
except ImportError:
    HAS_ULTRALYTICS = False

from models.vehicle_detector import VehicleDetector
from models.plate_detector import PlateDetector
from models.ocr_engine import OCREngine
from models.hsrp_classifier import HSRPClassifier
from services.sms_service import sms_service

# Create weights and reports directory if it doesn't exist
os.makedirs("weights", exist_ok=True)
reports_dir = os.path.join(os.path.dirname(__file__), "reports")
os.makedirs(reports_dir, exist_ok=True)

class SmsRequest(BaseModel):
    phone_number: str
    message: str

app = FastAPI(
    title="HSRP Real-time Traffic Surveillance & HSRP Compliance API",
    description="Backend service for detecting vehicles, license plates, extracting numbers, and validating HSRP status.",
    version="1.0.0"
)

# Mount the reports directory for downloading PDFs
app.mount("/reports", StaticFiles(directory=reports_dir), name="reports")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize deep learning or high-fidelity mock pipelines
print("--------------------------------------------------")
print("Initializing HSRP Detection Pipelines...")
print("--------------------------------------------------")
vehicle_detector = VehicleDetector("weights/yolov8n.pt")
plate_detector = PlateDetector("weights/plate_yolov8.pt")
ocr_engine = OCREngine()
hsrp_classifier = HSRPClassifier("weights/hsrp_cnn.pth")
print("--------------------------------------------------")
print("All systems initialized and ready to stream!")
print("--------------------------------------------------")

def decode_base64_image(base64_string):
    """Convert base64 string from frontend canvas into an OpenCV BGR image"""
    if not base64_string:
        return None
        
    try:
        # Strip off prefix if it exists (e.g., "data:image/jpeg;base64,")
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
            
        # Decode base64
        img_data = base64.b64decode(base64_string)
        img = Image.open(BytesIO(img_data))
        
        # Convert RGB to OpenCV BGR format
        img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        return img_cv
    except Exception as e:
        print(f"Error decoding base64 image: {e}")
        return None

async def process_frame(frame, websocket: WebSocket, frame_id: str = None):
    """
    Core AI Pipeline:
    1. Detect License Plates (YOLOv8 / Center-Bottom Box) directly on frame
    2. Crop plate -> Read License Number (EasyOCR / State Code Persistence)
    3. Send plate_detected
    4. Validate HSRP Compliance (PyTorch CNN / OpenCV HSV blue-strip test)
    5. Send hsrp_result
    """
    if frame is None:
        return

    try:
        h, w = frame.shape[:2]
            
        # 1. Detect vehicles
        vehicles = vehicle_detector.detect(frame)
        
        for vehicle in vehicles:
            vx1, vy1, vx2, vy2 = vehicle['bbox']
            vx1, vy1 = max(0, vx1), max(0, vy1)
            vx2, vy2 = min(w, vx2), min(h, vy2)
            
            if (vx2 - vx1) <= 0 or (vy2 - vy1) <= 0:
                continue
                
            vehicle_crop = frame[vy1:vy2, vx1:vx2]
            
            # 2. Detect number plates inside the vehicle crop
            plates = plate_detector.detect(vehicle_crop)
            
            for plate in plates:
                px1, py1, px2, py2 = plate['bbox']
                
                # Constrain bounding boxes to vehicle_crop dimensions
                px1, py1 = max(0, px1), max(0, py1)
                px2, py2 = min(vehicle_crop.shape[1], px2), min(vehicle_crop.shape[0], py2)
                
                if (px2 - px1) <= 0 or (py2 - py1) <= 0:
                    continue
                    
                plate_crop = vehicle_crop[py1:py2, px1:px2]
                
                # Extract plate number text using OCR
                plate_text, text_bbox = ocr_engine.read_plate(plate_crop)
                
                # Compute absolute coordinates relative to the full frame
                abs_px1 = vx1 + px1
                abs_py1 = vy1 + py1
                abs_px2 = vx1 + px2
                abs_py2 = vy1 + py2
                
                # Default absolute normalized coordinates for frontend overlay
                abs_x1 = abs_px1 / w
                abs_y1 = abs_py1 / h
                abs_x2 = abs_px2 / w
                abs_y2 = abs_py2 / h
            
            actual_plate_crop = plate_crop
            if text_bbox is not None:
                # Add slight padding
                tx1, ty1, tx2, ty2 = text_bbox
                h_crop, w_crop = plate_crop.shape[:2]
                pad_x = int((tx2 - tx1) * 0.1)
                pad_y = int((ty2 - ty1) * 0.4)
                
                tx1 = max(0, tx1 - pad_x)
                ty1 = max(0, ty1 - pad_y)
                tx2 = min(w_crop, tx2 + pad_x)
                ty2 = min(h_crop, ty2 + pad_y)
                
                if (tx2 - tx1) > 0 and (ty2 - ty1) > 0:
                    actual_plate_crop = plate_crop[ty1:ty2, tx1:tx2]
                    
                    # Update absolute coordinates for frontend overlay based on exact text box
                    abs_x1 = (vx1 + px1 + tx1) / w
                    abs_y1 = (vy1 + py1 + ty1) / h
                    abs_x2 = (vx1 + px1 + tx2) / w
                    abs_y2 = (vy1 + py1 + ty2) / h
            
            # Encode plate_crop to base64 for frontend display
            _, buffer = cv2.imencode('.jpg', plate_crop)
            plate_img_base64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')
            
            detection_id = str(uuid.uuid4())
            
            # Stage 1: Send Plate Detection instantly
            await websocket.send_json({
                'type': 'plate_detected',
                'frame_id': frame_id,
                'detection': {
                    'id': detection_id,
                    'plate_number': plate_text,
                    'hsrp_status': 'checking',
                    'confidence': 100.0, # Will be updated in HSRP check if needed
                    'features': None,
                    'plate_image': plate_img_base64,
                    'bounding_box': {
                        'x': float(abs_x1),
                        'y': float(abs_y1),
                        'width': float(abs_x2 - abs_x1),
                        'height': float(abs_y2 - abs_y1)
                    }
                }
            })
            
            # Yield control so websocket can flush
            await asyncio.sleep(0.01)
            
            # Stage 2: Perform HSRP compliance verification on the full plate crop (so we don't cut off the blue strip)
            is_hsrp, confidence, features = hsrp_classifier.classify(plate_crop, plate_text)
            
            await websocket.send_json({
                'type': 'hsrp_result',
                'frame_id': frame_id,
                'id': detection_id,
                'plate_number': plate_text,
                'hsrp_status': 'valid' if is_hsrp else 'invalid',
                'confidence': float(confidence * 100),
                'features': features
            })
            
            await asyncio.sleep(0.01)
            
    except Exception as e:
        print(f"Error executing AI processing pipeline: {e}")

@app.websocket("/ws/detect")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time video stream detection.
    Expects JSON containing base64 JPEG frame.
    """
    await websocket.accept()
    print("WebSocket client connected successfully!")
    
    try:
        while True:
            # Receive text frame payload from frontend
            data = await websocket.receive_text()
            message = json.loads(data)
            
            frame_base64 = message.get('frame', '')
            frame_id = message.get('frame_id', '')
            if not frame_base64:
                continue
                
            # Decode frame
            frame = decode_base64_image(frame_base64)
            if frame is None:
                continue
                
            # Process frame directly. Although CPU bound, it's safer for this demo.
            await process_frame(frame, websocket, frame_id)
                    
    except WebSocketDisconnect:
        print("WebSocket client disconnected gracefully.")
    except Exception as e:
        print(f"WebSocket session error: {e}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass

def process_frame_sync(frame):
    import asyncio
    # Create an event loop for running the async function synchronously
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(process_frame(frame))

@app.get("/")
async def root():
    return {
        "service": "HSRP Surveillance AI Backend",
        "status": "running",
        "endpoints": {
            "root": "/",
            "health": "/health",
            "detect_websocket": "/ws/detect"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models": {
            "vehicle_detector": "loaded" if vehicle_detector else "missing",
            "plate_detector": "loaded" if plate_detector else "missing",
            "ocr_engine": "loaded" if ocr_engine else "missing",
            "hsrp_classifier": "loaded" if hsrp_classifier else "missing"
        },
        "environment": {
            "has_torch": HAS_TORCH,
            "has_easyocr": HAS_EASYOCR,
            "has_ultralytics": HAS_ULTRALYTICS
        }
    }

@app.post("/api/sms/send")
async def send_sms_api(req: SmsRequest):
    try:
        response = sms_service.send_sms(req.phone_number, req.message)
        return {
            "status": response.status,
            "message_id": response.message_id,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ReportRequest(BaseModel):
    plate_number: str
    violation_date: str
    image_base64: str
    fine_amount: int
    recipient_phone: str

@app.post("/api/reports/generate")
async def generate_report(request: ReportRequest):
    import os
    import base64
    from fpdf import FPDF
    
    reports_dir = os.path.join(os.path.dirname(__file__), "reports")
    os.makedirs(reports_dir, exist_ok=True)
    
    try:
        img_data_str = request.image_base64
        if "," in img_data_str:
            img_data_str = img_data_str.split(",")[1]
            
        img_data = base64.b64decode(img_data_str)
        img_path = os.path.join(reports_dir, f"{request.plate_number}.jpg")
        with open(img_path, "wb") as f:
            f.write(img_data)
            
        pdf = FPDF()
        pdf.add_page()
        
        # Add a border
        pdf.set_draw_color(0, 0, 0)
        pdf.set_line_width(1)
        pdf.rect(5.0, 5.0, 200.0, 287.0)
        
        # Header Background
        pdf.set_fill_color(200, 220, 255)
        pdf.rect(5.0, 5.0, 200.0, 30.0, style='F')
        
        # Header Text
        pdf.set_font("helvetica", 'B', 20)
        pdf.set_text_color(0, 51, 102)
        pdf.cell(0, 15, text="E-CHALLAN / TRAFFIC VIOLATION REPORT", align='C', new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("helvetica", 'B', 12)
        pdf.cell(0, 5, text="Ministry of Road Transport and Highways (MoRTH)", align='C', new_x="LMARGIN", new_y="NEXT")
        
        pdf.ln(15)
        
        # Section Title
        pdf.set_fill_color(220, 220, 220)
        pdf.set_text_color(0, 0, 0)
        pdf.set_font("helvetica", 'B', 14)
        pdf.cell(0, 10, text=" 1. VIOLATION DETAILS", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(5)
        
        # Details
        pdf.set_font("helvetica", 'B', 12)
        pdf.cell(40, 10, text="Vehicle Plate:", border=0)
        pdf.set_font("helvetica", '', 12)
        pdf.cell(0, 10, text=request.plate_number, border=0, new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font("helvetica", 'B', 12)
        pdf.cell(40, 10, text="Date & Time:", border=0)
        pdf.set_font("helvetica", '', 12)
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(request.violation_date.replace('Z', '+00:00'))
            dt_str = dt.strftime("%Y-%m-%d %H:%M:%S")
        except:
            dt_str = request.violation_date
        pdf.cell(0, 10, text=dt_str, border=0, new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font("helvetica", 'B', 12)
        pdf.cell(40, 10, text="Offence:", border=0)
        pdf.set_font("helvetica", 'B', 12)
        pdf.set_text_color(200, 0, 0)
        pdf.cell(0, 10, text="Non-compliant HSRP (High Security Registration Plate)", border=0, new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(0, 0, 0)
        
        pdf.set_font("helvetica", 'B', 12)
        pdf.cell(40, 10, text="Fine Amount:", border=0)
        pdf.set_font("helvetica", 'B', 14)
        pdf.cell(0, 10, text=f"Rs. {request.fine_amount}/-", border=0, new_x="LMARGIN", new_y="NEXT")
        
        pdf.ln(10)
        
        # Section Title 2
        pdf.set_font("helvetica", 'B', 14)
        pdf.cell(0, 10, text=" 2. PHOTOGRAPHIC EVIDENCE", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(10)
        
        # Calculate aspect ratio to fit image beautifully
        import cv2
        img = cv2.imread(img_path)
        if img is not None:
            h, w = img.shape[:2]
            aspect = w / h
            w_pdf = 140
            h_pdf = w_pdf / aspect
            pdf.image(img_path, x=35, y=pdf.get_y(), w=w_pdf, h=h_pdf)
            pdf.set_y(pdf.get_y() + h_pdf + 20)
        else:
            pdf.image(img_path, x=35, y=pdf.get_y(), w=140)
            pdf.set_y(pdf.get_y() + 80)
            
        # Footer
        pdf.set_y(250)
        pdf.set_font("helvetica", 'I', 10)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 10, text="This is an automatically generated e-Challan report via AI Traffic Enforcement System.", align='C', new_x="LMARGIN", new_y="NEXT")
        pdf.cell(0, 10, text="Please pay the fine within 15 days to avoid legal action.", align='C', new_x="LMARGIN", new_y="NEXT")
        
        pdf_filename = f"{request.plate_number}_report.pdf"
        pdf_path = os.path.join(reports_dir, pdf_filename)
        pdf.output(pdf_path)
        
        return {
            "status": "success", 
            "pdf_url": f"http://localhost:8000/reports/{pdf_filename}",
            "pdf_path": os.path.abspath(pdf_path),
            "img_path": os.path.abspath(img_path)
        }
    except Exception as e:
        print(f"Failed to generate PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/whatsapp/send-report")
async def send_whatsapp_report(request: ReportRequest):
    import pywhatkit
    
    try:
        # Generate the report first
        res = await generate_report(request)
        
        caption = f"*TRAFFIC VIOLATION ALERT*\nVehicle: {request.plate_number}\nFine: Rs.{request.fine_amount}\nDate: {request.violation_date}\n\nYour official PDF report has been generated and is available at:\n{res['pdf_url']}"
        
        # PyWhatKit opens the browser and types the message along with the image
        pywhatkit.sendwhats_image(request.recipient_phone, res["img_path"], caption, wait_time=15, tab_close=True, close_time=3)
        return {"status": "success", "message": "WhatsApp message queued."}
    except Exception as e:
        print(f"Failed to send WhatsApp: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Start ASGI server on all network interfaces, port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
