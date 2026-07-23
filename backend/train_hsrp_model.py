import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import sys

# Ensure backend path is in sys.path so we can import from models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.hsrp_classifier import HSRPClassifierModel

# Define paths
REGULAR_PLATE_DIR = r"E:\Kumbhar Mam project\Regular Plate"
HSRP_PLATE_DIR = r"E:\Kumbhar Mam project\HSRP Plate"
WEIGHTS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "weights", "hsrp_cnn.pth")

class PlateDataset(Dataset):
    def __init__(self, regular_dir, hsrp_dir, transform=None):
        self.samples = []
        self.transform = transform
        
        # Load Regular Plates (Class 0: Invalid/Non-HSRP)
        if os.path.exists(regular_dir):
            for img_name in os.listdir(regular_dir):
                if img_name.lower().endswith(('.png', '.jpg', '.jpeg')):
                    self.samples.append((os.path.join(regular_dir, img_name), 0))
        else:
            print(f"Warning: Directory not found: {regular_dir}")
            
        # Load HSRP Plates (Class 1: Valid/HSRP)
        if os.path.exists(hsrp_dir):
            for img_name in os.listdir(hsrp_dir):
                if img_name.lower().endswith(('.png', '.jpg', '.jpeg')):
                    self.samples.append((os.path.join(hsrp_dir, img_name), 1))
        else:
            print(f"Warning: Directory not found: {hsrp_dir}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert('RGB')
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

def train_model():
    print("Initializing training...")
    
    # Define transformations matching the classifier's preprocessing
    # The classifier uses (128, 32)
    transform = transforms.Compose([
        transforms.Resize((128, 32)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225])
    ])
    
    # Create dataset and dataloader
    dataset = PlateDataset(REGULAR_PLATE_DIR, HSRP_PLATE_DIR, transform=transform)
    print(f"Found {len(dataset)} total images for training.")
    
    if len(dataset) == 0:
        print("No images found! Aborting training.")
        return
        
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True)
    
    # Initialize model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    model = HSRPClassifierModel().to(device)
    
    # Define loss function and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # Training Loop
    epochs = 15
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for inputs, labels in dataloader:
            inputs, labels = inputs.to(device), labels.to(device)
            
            # Zero the parameter gradients
            optimizer.zero_grad()
            
            # Forward pass
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            # Backward pass and optimize
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
        epoch_loss = running_loss / len(dataloader)
        epoch_acc = 100 * correct / total
        print(f"Epoch [{epoch+1}/{epochs}] Loss: {epoch_loss:.4f} Acc: {epoch_acc:.2f}%")
        
    # Save the weights
    os.makedirs(os.path.dirname(WEIGHTS_PATH), exist_ok=True)
    torch.save(model.state_dict(), WEIGHTS_PATH)
    print(f"Training complete! Weights saved successfully to: {WEIGHTS_PATH}")

if __name__ == "__main__":
    train_model()
