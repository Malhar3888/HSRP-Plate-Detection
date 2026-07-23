import os
import cv2
from utils.image_processing import detect_blue_strip

# Try importing deep learning libraries gracefully
try:
    import torch
    import torch.nn as nn
    import torchvision.transforms as transforms
    from PIL import Image
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

if HAS_TORCH:
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
    def __init__(self, model_path="weights/hsrp_cnn.pth"):
        """Initialize HSRP CNN classifier"""
        self.model_path = model_path
        self.use_real_model = False
        
        if HAS_TORCH:
            try:
                if os.path.exists(model_path):
                    self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
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
                    self.use_real_model = True
                    print(f"HSRP PyTorch CNN Classifier loaded successfully on {self.device}.")
                else:
                    print(f"CNN weights not found at {model_path}. Using high-fidelity OpenCV HSRP validator.")
            except Exception as e:
                print(f"Error loading PyTorch HSRP model: {e}. Falling back to OpenCV HSRP validator.")
        else:
            print("PyTorch or dependencies not available. Using high-fidelity OpenCV HSRP validator.")

    def classify(self, plate_image, plate_text=""):
        """
        Classify if plate is HSRP compliant
        
        Returns:
            (is_hsrp: bool, confidence: float, features: dict)
        """
        if plate_image is None or plate_image.size == 0:
            return False, 0.0, {'blue_strip': False, 'proper_structure': False}

        import re
        cleaned_text = re.sub(r'[^A-Z0-9]', '', str(plate_text).upper())
        
        # A valid HSRP plate is clean and only contains the plate number (typically 8 to 11 characters).
        # If it has > 11 characters, it contains unnecessary text, logos, or designs.
        has_proper_structure = 6 <= len(cleaned_text) <= 12

        # High-fidelity OpenCV / Color checking fallback
        # Real-world HSRP plates must contain a blue IND strip on the left margin.
        blue_ratio = detect_blue_strip(plate_image)
        has_blue_strip = blue_ratio > 0.005
        features = {
            'blue_strip': has_blue_strip,
            'blue_ratio': round(blue_ratio, 4),
            'proper_structure': has_proper_structure
        }
        
        if not has_proper_structure:
            # Reject immediately if it contains unnecessary things
            return False, 0.96, features

        # If real deep learning pipeline is initialized and loaded, use it
        if self.use_real_model:
            try:
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
                
                is_hsrp_cnn = bool(predicted.item() == 1)
                confidence_cnn = float(confidence.item())
                
                # Consensus logic to reduce false positives/negatives
                if not has_blue_strip:
                    # If there's absolutely no blue (not even 0.5%), it's highly likely non-HSRP
                    return False, max(confidence_cnn, 0.95), features
                else:
                    if is_hsrp_cnn:
                        # Both CNN and OpenCV agree it's HSRP
                        return True, max(confidence_cnn, 0.95), features
                    else:
                        # CNN says Non-HSRP, but OpenCV found a little bit of blue (> 0.5%).
                        # Only override the CNN if the blue strip is extremely prominent (> 1.5%),
                        # otherwise trust the CNN's Non-HSRP prediction to prevent false positives.
                        if blue_ratio > 0.015:
                            return True, 0.96, features
                        else:
                            return False, max(confidence_cnn, 0.96), features
                        
            except Exception as e:
                print(f"Inference error in CNN classifier: {e}. Falling back to OpenCV validator.")

        
        if blue_ratio > 0.005:
            # High probability HSRP plate if IND strip is verified clearly via OpenCV
            return True, 0.96, features
        else:
            # Low probability of HSRP if no blue strip is found on the left margin
            return False, 0.96, features
