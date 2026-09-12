import os
import glob
import random
import cv2
import numpy as np
from PIL import Image

def extract_mask_and_inpaint(img_rgb):
    """
    Given an RGB image containing yellow/cyan annotation strokes:
    1. Detects annotation stroke pixels.
    2. Builds filled binary tree crown masks.
    3. Inpaints the annotation strokes in the RGB image to restore clean canopy textures.
    """
    h, w, c = img_rgb.shape
    r = img_rgb[:, :, 0]
    g = img_rgb[:, :, 1]
    b = img_rgb[:, :, 2]

    # Yellow contour detection: high red, high green, low blue
    yellow_mask = (r > 155) & (g > 155) & (b < 130) & (np.abs(r.astype(int) - g.astype(int)) < 60)
    
    # Cyan contour detection if any
    cyan_mask = (r < 110) & (g > 170) & (b > 170)
    
    stroke_mask = (yellow_mask | cyan_mask).astype(np.uint8) * 255
    
    # Morphological closing to seal any broken boundary loops
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    closed_contours = cv2.morphologyEx(stroke_mask, cv2.MORPH_CLOSE, kernel)
    
    # Find external contours and fill them to produce solid tree crown masks
    contours, hierarchy = cv2.findContours(closed_contours, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    crown_mask = np.zeros((h, w), dtype=np.uint8)
    valid_crowns = 0
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 150: # Filter tiny speckles
            cv2.drawContours(crown_mask, [cnt], -1, 255, thickness=cv2.FILLED)
            valid_crowns += 1
            
    # Also inpaint the annotation strokes so the model trains on pure mangrove canopy
    if np.sum(stroke_mask) > 0:
        # Dilate the stroke mask slightly for cleaner inpainting
        inpaint_mask = cv2.dilate(stroke_mask, kernel, iterations=1)
        clean_img_bgr = cv2.inpaint(cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR), inpaint_mask, 3, cv2.INPAINT_TELEA)
        clean_img_rgb = cv2.cvtColor(clean_img_bgr, cv2.COLOR_BGR2RGB)
    else:
        clean_img_rgb = img_rgb.copy()
        
    return clean_img_rgb, crown_mask, valid_crowns

def preprocess_dataset(source_dir="data/mangrove_uav_data", output_dir="data/processed_uav", split_ratio=0.75, seed=42):
    random.seed(seed)
    np.random.seed(seed)
    
    image_paths = sorted(glob.glob(os.path.join(source_dir, "*.png")))
    total_count = len(image_paths)
    print(f"[PREPROCESS] Found {total_count} UAV images in '{source_dir}'")
    
    # Shuffle for split
    indices = list(range(total_count))
    random.shuffle(indices)
    
    train_count = int(round(total_count * split_ratio))
    test_count = total_count - train_count
    print(f"[PREPROCESS] Split: 75% Train = {train_count} images | 25% Test = {test_count} images")
    
    splits = {
        "train": indices[:train_count],
        "test": indices[train_count:]
    }
    
    # Setup output directory structure
    for split_name in ["train", "test"]:
        os.makedirs(os.path.join(output_dir, split_name, "images"), exist_ok=True)
        os.makedirs(os.path.join(output_dir, split_name, "masks"), exist_ok=True)
        
    stats = {
        "train_trees": 0,
        "test_trees": 0,
        "total_canopy_coverage_train": [],
        "total_canopy_coverage_test": []
    }
    
    print("[PREPROCESS] Processing and inpainting images...")
    for split_name, idx_list in splits.items():
        for i, idx in enumerate(idx_list):
            img_path = image_paths[idx]
            filename = os.path.basename(img_path)
            
            with Image.open(img_path) as pil_img:
                img_rgb = np.array(pil_img.convert("RGB"))
                
            clean_rgb, crown_mask, num_trees = extract_mask_and_inpaint(img_rgb)
            
            # Save preprocessed image and mask
            out_img_path = os.path.join(output_dir, split_name, "images", filename)
            out_mask_path = os.path.join(output_dir, split_name, "masks", filename)
            
            Image.fromarray(clean_rgb).save(out_img_path)
            Image.fromarray(crown_mask).save(out_mask_path)
            
            canopy_pct = (np.sum(crown_mask > 0) / crown_mask.size) * 100.0
            if split_name == "train":
                stats["train_trees"] += num_trees
                stats["total_canopy_coverage_train"].append(canopy_pct)
            else:
                stats["test_trees"] += num_trees
                stats["total_canopy_coverage_test"].append(canopy_pct)
                
            if (i + 1) % 25 == 0 or (i + 1) == len(idx_list):
                print(f"  [{split_name.upper()}] Processed {i + 1}/{len(idx_list)} images...")
                
    print("\n[PREPROCESS SUMMARY]")
    print(f"  - Train Set: {train_count} images, {stats['train_trees']} detected tree crowns, avg canopy coverage: {np.mean(stats['total_canopy_coverage_train']):.1f}%")
    print(f"  - Test Set:  {test_count} images, {stats['test_trees']} detected tree crowns, avg canopy coverage: {np.mean(stats['total_canopy_coverage_test']):.1f}%")
    print(f"  - Output Saved To: {os.path.abspath(output_dir)}")

if __name__ == "__main__":
    preprocess_dataset()
