import os
import glob
import cv2
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))
from models.hsrp_classifier import HSRPClassifier

REGULAR_PLATE_DIR = r"E:\Kumbhar Mam project\Regular Plate"
HSRP_PLATE_DIR = r"E:\Kumbhar Mam project\HSRP Plate"

def test_model():
    classifier = HSRPClassifier("backend/weights/hsrp_cnn.pth")
    
    if not classifier.use_real_model:
        print("Model failed to load PyTorch! Check dependencies.")
        return
        
    print("\n--- Testing HSRP Plates (Should be Valid) ---")
    hsrp_images = glob.glob(os.path.join(HSRP_PLATE_DIR, "*.jpg")) + glob.glob(os.path.join(HSRP_PLATE_DIR, "*.png"))
    for img_path in hsrp_images:
        img = cv2.imread(img_path)
        if img is not None:
            is_hsrp, conf = classifier.classify(img)
            status = "Valid" if is_hsrp else "Invalid"
            print(f"{os.path.basename(img_path)[:20]:<20} -> {status:<10} ({conf*100:.2f}%)")

    print("\n--- Testing Regular Plates (Should be Invalid) ---")
    regular_images = glob.glob(os.path.join(REGULAR_PLATE_DIR, "*.jpg")) + glob.glob(os.path.join(REGULAR_PLATE_DIR, "*.png"))
    for img_path in regular_images:
        img = cv2.imread(img_path)
        if img is not None:
            is_hsrp, conf = classifier.classify(img)
            status = "Valid" if is_hsrp else "Invalid"
            print(f"{os.path.basename(img_path)[:20]:<20} -> {status:<10} ({conf*100:.2f}%)")

if __name__ == "__main__":
    test_model()
