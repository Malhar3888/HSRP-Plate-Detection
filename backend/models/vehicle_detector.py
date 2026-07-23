import os
import cv2
import numpy as np
import time

try:
    from ultralytics import YOLO
    HAS_ULTRALYTICS = True
except ImportError:
    HAS_ULTRALYTICS = False

class VehicleDetector:
    def __init__(self, model_path="weights/yolov8n.pt"):
        """Initialize YOLOv8 vehicle detector"""
        self.model_path = model_path
        self.use_real_model = False
        self.vehicle_classes = ['car', 'motorcycle', 'bus', 'truck']
        
        # State for OpenCV interactive motion detection fallback
        self.prev_gray = None
        self.last_detection_time = 0
        self.active_bbox = None
        
        if HAS_ULTRALYTICS:
            try:
                # Load pre-trained general YOLOv8 model (standard weights download automatically if missing)
                self.model = YOLO(model_path)
                self.use_real_model = True
                print(f"YOLOv8 Vehicle Detector loaded successfully from {model_path}.")
            except Exception as e:
                print(f"Error loading YOLOv8 vehicle model: {e}. Using motion-sensitive vehicle localizer.")
        else:
            print("ultralytics package not available. Using motion-sensitive vehicle localizer.")

    def detect(self, frame):
        """
        Detect vehicles in frame
        
        Returns:
            List of detected vehicles with bounding boxes
        """
        if frame is None or frame.size == 0:
            return []

        if self.use_real_model:
            try:
                results = self.model(frame, conf=0.4)
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
                
                # If YOLO detected real vehicles, return them immediately
                if vehicles:
                    return vehicles
            except Exception as e:
                print(f"YOLOv8 vehicle detection inference error: {e}. Falling back to motion-based localizer.")

        # Interactive Motion-Sensitive OpenCV Fallback
        # This makes webcam interaction incredibly premium without needing standard vehicle objects in the background.
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)
        
        current_time = time.time()
        
        # Initialize previous frame
        if self.prev_gray is None:
            self.prev_gray = gray
            return []
            
        # Compute absolute difference
        frame_diff = cv2.absdiff(self.prev_gray, gray)
        thresh = cv2.threshold(frame_diff, 25, 255, cv2.THRESH_BINARY)[1]
        thresh = cv2.dilate(thresh, None, iterations=2)
        
        # Calculate amount of motion (non-zero pixels)
        motion_level = cv2.countNonZero(thresh)
        motion_ratio = motion_level / (h * w)
        
        self.prev_gray = gray
        
        # If there is active motion (e.g. user showing license plate or waving hand)
        if motion_ratio > 0.015:  # At least 1.5% of pixels changed
            # Find contours
            contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Get largest contour
                largest_contour = max(contours, key=cv2.contourArea)
                if cv2.contourArea(largest_contour) > 5000:  # Minimum size
                    x, y, bw, bh = cv2.boundingRect(largest_contour)
                    
                    # Add padding
                    padding = 50
                    x1 = max(0, x - padding)
                    y1 = max(0, y - padding)
                    x2 = min(w, x + bw + padding)
                    y2 = min(h, y + bh + padding)
                    
                    self.active_bbox = [x1, y1, x2, y2]
                    self.last_detection_time = current_time
                    
        # Maintain the active bounding box for 2 seconds after motion stops
        # This keeps the "box" around the user's hand/plate stable so OCR can read it
        if self.active_bbox is not None and (current_time - self.last_detection_time) < 2.0:
            return [{
                'bbox': self.active_bbox,
                'confidence': 0.8,
                'class': 'motion_target'
            }]
            
        # Fallback: if no vehicle and no motion, just return the whole frame
        # This guarantees that if the user holds up a phone image perfectly still,
        # the system will still scan the whole frame for a license plate!
        return [{
            'bbox': [0, 0, w, h],
            'confidence': 0.5,
            'class': 'full_frame_fallback'
        }]
