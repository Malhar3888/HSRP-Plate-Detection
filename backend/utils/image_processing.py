import cv2
import numpy as np

def enhance_plate_image(plate_image):
    """
    Enhance plate image for better OCR
    """
    if plate_image is None or plate_image.size == 0:
        return plate_image
        
    try:
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
    except Exception as e:
        print(f"Error enhancing plate image: {e}")
        return plate_image

def detect_blue_strip(plate_image):
    """
    Detect blue IND strip (HSRP feature) on the left 20% of the number plate.
    Uses HSV color space detection.
    """
    if plate_image is None or plate_image.size == 0:
        return False
        
    try:
        # Convert to HSV
        hsv = cv2.cvtColor(plate_image, cv2.COLOR_BGR2HSV)
        
        # Broaden blue color range in HSV to catch light/dark blue IND text
        lower_blue = np.array([90, 40, 40])
        upper_blue = np.array([140, 255, 255])
        
        # Create mask
        mask = cv2.inRange(hsv, lower_blue, upper_blue)
        
        # Check if blue text/strip exists (specifically on the left side of the plate)
        h, w = mask.shape
        left_limit = max(1, int(w * 0.25))
        left_region = mask[:, :left_limit]
        blue_pixels = cv2.countNonZero(left_region)
        
        # Total pixels in the target left-hand region
        total_pixels = h * left_limit
        
        # Calculate the ratio of blue pixels in the left region
        ratio = blue_pixels / total_pixels if total_pixels > 0 else 0.0
        
        return ratio
    except Exception as e:
        print(f"Error detecting blue strip: {e}")
        return 0.0
