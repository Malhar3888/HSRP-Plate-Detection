import math
import cv2
import numpy as np
import time

class PlateCandidate:
    def __init__(self, crop, confidence, bbox):
        self.crop = crop
        self.confidence = confidence
        self.bbox = bbox
        self.sharpness = self._calculate_sharpness(crop)
        self.resolution_score = self._calculate_resolution(crop)
        self.timestamp = time.time()
        
    def _calculate_sharpness(self, image):
        if image is None or image.size == 0:
            return 0
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        return cv2.Laplacian(gray, cv2.CV_64F).var()
        
    def _calculate_resolution(self, image):
        if image is None or image.size == 0:
            return 0
        return image.shape[0] * image.shape[1]

class PlateTrack:
    def __init__(self, track_id, max_candidates=10):
        self.track_id = track_id
        self.candidates = []
        self.max_candidates = max_candidates
        self.disappeared_count = 0
        self.created_at = time.time()
        self.last_updated = time.time()
        self.ocr_triggered = False
        
    def add_candidate(self, candidate):
        if len(self.candidates) < self.max_candidates:
            self.candidates.append(candidate)
        else:
            # Replace the worst candidate if this one is better (based on sharpness)
            worst_idx = min(range(len(self.candidates)), key=lambda i: self.candidates[i].sharpness)
            if candidate.sharpness > self.candidates[worst_idx].sharpness:
                self.candidates[worst_idx] = candidate
        self.last_updated = time.time()
        
    def get_best_candidates(self, top_n=3):
        """Return the best quality crops for OCR based on sharpness & confidence."""
        if not self.candidates:
            return []
        # Sort by sharpness predominantly, then confidence
        sorted_candidates = sorted(self.candidates, key=lambda c: (c.sharpness * 0.7) + (c.confidence * 100 * 0.3), reverse=True)
        return sorted_candidates[:top_n]

class CentroidTracker:
    def __init__(self, max_disappeared=5, max_distance=100):
        self.next_object_id = 0
        self.tracks = {}  # dict mapping track_id -> PlateTrack
        self.centroids = {} # dict mapping track_id -> (cx, cy)
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance

    def register(self, centroid, candidate):
        track = PlateTrack(self.next_object_id)
        track.add_candidate(candidate)
        self.tracks[self.next_object_id] = track
        self.centroids[self.next_object_id] = centroid
        self.next_object_id += 1
        return self.next_object_id - 1

    def deregister(self, object_id):
        del self.tracks[object_id]
        del self.centroids[object_id]

    def update(self, rects, candidates):
        """
        rects: list of (x1, y1, x2, y2)
        candidates: list of PlateCandidate objects corresponding to rects
        """
        if len(rects) == 0:
            for object_id in list(self.tracks.keys()):
                self.tracks[object_id].disappeared_count += 1
            return self.tracks

        input_centroids = np.zeros((len(rects), 2), dtype="int")
        for (i, (x1, y1, x2, y2)) in enumerate(rects):
            cX = int((x1 + x2) / 2.0)
            cY = int((y1 + y2) / 2.0)
            input_centroids[i] = (cX, cY)

        if len(self.centroids) == 0:
            for i in range(0, len(input_centroids)):
                self.register(input_centroids[i], candidates[i])
        else:
            object_ids = list(self.centroids.keys())
            object_centroids = list(self.centroids.values())

            # Compute distance matrix between existing object centroids and input centroids
            D = np.zeros((len(object_centroids), len(input_centroids)))
            for i in range(len(object_centroids)):
                for j in range(len(input_centroids)):
                    D[i, j] = math.hypot(object_centroids[i][0] - input_centroids[j][0],
                                         object_centroids[i][1] - input_centroids[j][1])

            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]

            used_rows = set()
            used_cols = set()

            for (row, col) in zip(rows, cols):
                if row in used_rows or col in used_cols:
                    continue

                if D[row, col] > self.max_distance:
                    continue

                object_id = object_ids[row]
                self.centroids[object_id] = input_centroids[col]
                self.tracks[object_id].add_candidate(candidates[col])
                self.tracks[object_id].disappeared_count = 0

                used_rows.add(row)
                used_cols.add(col)

            unused_rows = set(range(0, D.shape[0])).difference(used_rows)
            unused_cols = set(range(0, D.shape[1])).difference(used_cols)

            for row in unused_rows:
                object_id = object_ids[row]
                self.tracks[object_id].disappeared_count += 1

            for col in unused_cols:
                self.register(input_centroids[col], candidates[col])

        return self.tracks
