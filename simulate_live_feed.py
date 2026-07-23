import os
import asyncio
import base64
import json
import glob
import websockets
import cv2

REGULAR_PLATE_DIR = r"E:\Kumbhar Mam project\Regular Plate"
HSRP_PLATE_DIR = r"E:\Kumbhar Mam project\HSRP Plate"

async def simulate_feed():
    uri = "ws://localhost:8000/ws/detect"
    
    # Gather all images
    hsrp_images = glob.glob(os.path.join(HSRP_PLATE_DIR, "*.jpg")) + glob.glob(os.path.join(HSRP_PLATE_DIR, "*.png"))
    regular_images = glob.glob(os.path.join(REGULAR_PLATE_DIR, "*.jpg")) + glob.glob(os.path.join(REGULAR_PLATE_DIR, "*.png"))
    
    all_images = []
    for img in hsrp_images:
        all_images.append((img, "HSRP"))
    for img in regular_images:
        all_images.append((img, "Regular"))
        
    if not all_images:
        print("No images found in the specified directories.")
        return

    print(f"Found {len(all_images)} images. Simulating live feed to backend...")
    
    async with websockets.connect(uri) as websocket:
        for img_path, label in all_images:
            print(f"\n--- Sending {label} Plate: {os.path.basename(img_path)} ---")
            
            # Read image and encode to base64
            img = cv2.imread(img_path)
            if img is None:
                continue
                
            # Resize image to simulate a webcam frame
            # The backend looks for vehicles, so we place the plate in the center of a black background
            # to simulate a car in a frame.
            frame = cv2.copyMakeBorder(img, 200, 200, 300, 300, cv2.BORDER_CONSTANT, value=[0, 0, 0])
            
            _, buffer = cv2.imencode('.jpg', frame)
            base64_str = base64.b64encode(buffer).decode('utf-8')
            
            # Send frame to WebSocket
            payload = json.dumps({"frame": base64_str})
            await websocket.send(payload)
            
            # Receive response
            response = await websocket.recv()
            d = json.loads(response)
            
            if isinstance(d, dict):
                print(f"Detection: Plate '{d.get('plate_number')}' -> Status: {d.get('hsrp_status')} (Confidence: {d.get('confidence'):.2f}%)")
            else:
                print("Unexpected response format:", d)
                
            await asyncio.sleep(1) # wait a bit before sending next frame

if __name__ == "__main__":
    asyncio.run(simulate_feed())
