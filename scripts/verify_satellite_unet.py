import os
import sys
import numpy as np
from PIL import Image
import torch
import torchvision.transforms.functional as TF
import cv2

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ml.models.satellite_unet import SatelliteRecoveryUNet

def verify_satellite_model(
    pair_path_2021="data/processed_satellite/test/images_2021/pair_01.png",
    pair_path_2024="data/processed_satellite/test/images_2024/pair_01.png",
    checkpoint_path="ml/models/mangrove_satellite_unet.pt",
    output_vis_path="reports/satellite_unet_recovery_overlay.png"
):
    print("=" * 75)
    print("    VERIFYING SATELLITE BI-TEMPORAL U-NET RECOVERY & EXPANSION MODEL")
    print("=" * 75)
    
    if not os.path.exists(pair_path_2021) or not os.path.exists(pair_path_2024):
        # Pick first available test pair
        import glob
        test_files = sorted(glob.glob("data/processed_satellite/test/images_2021/*.png"))
        if not test_files:
            print("[ERROR] No test files found in data/processed_satellite/test/")
            return
        fname = os.path.basename(test_files[0])
        pair_path_2021 = f"data/processed_satellite/test/images_2021/{fname}"
        pair_path_2024 = f"data/processed_satellite/test/images_2024/{fname}"
        
    print(f"[*] Testing Pair: 2021='{pair_path_2021}' vs 2024='{pair_path_2024}'")
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = SatelliteRecoveryUNet(in_channels=6, base_channels=32).to(device)
    
    ckpt = torch.load(checkpoint_path, map_location=device, weights_only=False)
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()
    print(f"[*] Loaded Model Checkpoint: {checkpoint_path} (Epoch {ckpt.get('epoch', '?')}, Val IoU={ckpt.get('val_iou_2024', 0.0):.3f})")
    
    im21 = Image.open(pair_path_2021).convert("RGB")
    im24 = Image.open(pair_path_2024).convert("RGB")
    
    t21 = TF.to_tensor(im21)
    t24 = TF.to_tensor(im24)
    input_tensor = torch.cat([t21, t24], dim=0).unsqueeze(0).to(device)
    
    with torch.no_grad():
        out = model(input_tensor)
        pred_21 = (torch.sigmoid(out["logits_2021"]) > 0.5).float().cpu().numpy()[0, 0]
        pred_24 = (torch.sigmoid(out["logits_2024"]) > 0.5).float().cpu().numpy()[0, 0]
        pred_delta = (torch.sigmoid(out["logits_delta"]) > 0.5).float().cpu().numpy()[0, 0]
        
    # Biophysical Metrics
    pixel_area_m2 = 10.0 * 10.0 # 10m Sentinel-2 GSD
    px21 = int(np.sum(pred_21))
    px24 = int(np.sum(pred_24))
    px_delta = int(np.sum(pred_delta))
    
    ha21 = (px21 * pixel_area_m2) / 10000.0
    ha24 = (px24 * pixel_area_m2) / 10000.0
    ha_delta = (px_delta * pixel_area_m2) / 10000.0
    pct_growth = ((ha24 - ha21) / (ha21 + 1e-5)) * 100.0
    tco2e = max(0.0, ha_delta * 28.5)
    
    print("-" * 75)
    print(f"[*] Satellite Biophysical Results:")
    print(f"    - Baseline Canopy Area (2021):  {ha21:.2f} ha ({px21:,} pixels)")
    print(f"    - Current Canopy Area (2024):   {ha24:.2f} ha ({px24:,} pixels)")
    print(f"    - Net Expansion (3 Years):      +{ha_delta:.2f} ha ({pct_growth:+.1f}% growth)")
    print(f"    - Verified Carbon Credit Yield: {tco2e:.2f} tCO2e credits")
    print("-" * 75)
    
    # Visual 4-panel image
    arr21 = np.array(im21)
    arr24 = np.array(im24)
    
    # Delta mask visual (white on black)
    delta_vis = np.stack([pred_delta * 255] * 3, axis=-1).astype(np.uint8)
    
    # Overlay on 2024 image: Emerald Green for expansion
    overlay = arr24.copy()
    overlay[pred_delta == 1] = [0, 255, 100]
    blended = cv2.addWeighted(arr24, 0.65, overlay, 0.35, 0)
    
    combined = np.hstack([arr21, arr24, delta_vis, blended])
    
    os.makedirs(os.path.dirname(output_vis_path), exist_ok=True)
    Image.fromarray(combined).save(output_vis_path)
    print(f"[SUCCESS] 4-panel visual report saved to: {os.path.abspath(output_vis_path)}")
    print("=" * 75)

if __name__ == "__main__":
    verify_satellite_model()
