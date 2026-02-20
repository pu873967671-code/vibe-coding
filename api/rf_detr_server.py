#!/usr/bin/env python3
"""
RF-DETR Object Detection API Server
Serves the RF-DETR model via HTTP for browser-based inference
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoImageProcessor, AutoModelForObjectDetection
from PIL import Image
import torch
import io
import base64

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from GitHub Pages

# Load model at startup
MODEL_NAME = "Omartificial-Intelligence-Space/RF-DETR-for-Weapon-Detection"
print(f"Loading model: {MODEL_NAME}")
processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
model = AutoModelForObjectDetection.from_pretrained(MODEL_NAME)
model.eval()
print("Model loaded successfully")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME})

@app.route('/detect', methods=['POST'])
def detect():
    try:
        # Get image from request (base64 or file upload)
        if 'image' in request.files:
            image = Image.open(request.files['image'].stream).convert('RGB')
        elif 'image_base64' in request.json:
            image_data = base64.b64decode(request.json['image_base64'].split(',')[1])
            image = Image.open(io.BytesIO(image_data)).convert('RGB')
        else:
            return jsonify({"error": "No image provided"}), 400

        # Run inference
        inputs = processor(images=image, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)

        # Post-process results
        target_sizes = torch.tensor([image.size[::-1]])
        results = processor.post_process_object_detection(
            outputs, 
            target_sizes=target_sizes,
            threshold=0.5
        )[0]

        # Format response
        detections = []
        for score, label, box in zip(results["scores"], results["labels"], results["boxes"]):
            detections.append({
                "label": model.config.id2label[label.item()],
                "score": float(score),
                "box": {
                    "xmin": float(box[0]),
                    "ymin": float(box[1]),
                    "xmax": float(box[2]),
                    "ymax": float(box[3])
                }
            })

        return jsonify({"detections": detections})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
