import os
import sys
import numpy as np
from PIL import Image
import cv2

# Add workspace root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ml.models.segmentation import MangroveSegmentationModel

def verify_drone_model(
    test_img_path="data/processed_uav/test/images/Screenshot 2026-09-12 124038.png",
    output_vis_path="reports/drone_uav_inference_overlay.png"
):
    print("=" * 70)
    print("        VERIFYING TRAINED DRONE UAV MANGROVE & CARBON MODEL")
    print("=" * 70)
    
    if not os.path.exists(test_img_path):
        # Fallback to first available test image
        import glob
        test_images = sorted(glob.glob("data/processed_uav/test/images/*.png"))
        if not test_images:
            print("[ERROR] No test images found in data/processed_uav/test/images/")
            return
        test_img_path = test_images[0]
        
    print(f"[*] Input Drone Image: {test_img_path}")
    
    # Load model
    model = MangroveSegmentationModel(model_checkpoint="ml/models/mangrove_drone_weights.pt")
    print(f"[*] Active Model Engine: {model.model_version}")
    
    # Read image
    pil_img = Image.open(test_img_path).convert("RGB")
    img_rgb = np.array(pil_img)
    
    # Predict mask
    mask, confidence = model.predict_mask(img_rgb)
    analysis = model.analyze_image(img_rgb, pixel_resolution_m=0.05) # 5cm drone GSD
    
    # Count individual tree crowns via connected components
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask.astype(np.uint8))
    # Filter tiny noise components < 50 px
    tree_count = sum(1 for stat in stats[1:] if stat[cv2.CC_STAT_AREA] > 50)
    
    # Blue carbon biomass allometry:
    # Canopy area
    h, w = mask.shape
    total_px = h * w
    canopy_px = int(np.sum(mask))
    canopy_pct = (canopy_px / total_px) * 100.0
    gsd_m = 0.05
    canopy_area_m2 = canopy_px * (gsd_m ** 2)
    canopy_area_ha = canopy_area_m2 / 10000.0
    
    # Allometric calculation:
    # 180 t AGB/ha * 1.49 (AGB+BGB) * 0.47 C * 3.667 CO2/C
    carbon_density_tco2e_per_ha = 180.0 * 1.49 * 0.47 * (44.0 / 12.0)
    carbon_credit_yield_tco2e = canopy_area_ha * carbon_density_tco2e_per_ha
    
    print("-" * 70)
    print(f"[*] Inference Results:")
    print(f"    - Model Confidence:        {confidence * 100:.1f}%")
    print(f"    - Canopy Coverage:         {canopy_pct:.2f}% ({canopy_px:,} / {total_px:,} pixels)")
    print(f"    - Estimated Tree Count:    {tree_count} individual crowns")
    print(f"    - Measured Canopy Area:    {canopy_area_m2:.2f} m² ({canopy_area_ha:.6f} hectares)")
    print(f"    - Blue Carbon Factor:      {carbon_density_tco2e_per_ha:.1f} tCO2e/ha")
    print(f"    - Projected Carbon Yield:  {carbon_credit_yield_tco2e:.4f} tCO2e credits")
    print("-" * 70)
    
    # Create side-by-side visualization:
    # 1. Original RGB
    # 2. Predicted Mask
    # 3. Transparent Green Overlay on RGB
    overlay = img_rgb.copy()
    overlay[mask == 1] = [0, 220, 60] # Bright emerald green
    blended = cv2.addWeighted(img_rgb, 0.65, overlay, 0.35, 0)
    
    # Mask visual (white on black)
    mask_visual = np.stack([mask * 255] * 3, axis=-1)
    
    # Concatenate side by side
    combined = np.hstack([img_rgb, mask_visual, blended])
    
    os.makedirs(os.path.dirname(output_vis_path), exist_ok=True)
    Image.fromarray(combined).save(output_vis_path)
    print(f"[SUCCESS] Visual verification overlay saved to: {os.path.abspath(output_vis_path)}")
    print("=" * 70)

if __name__ == "__main__":
    verify_drone_model()
