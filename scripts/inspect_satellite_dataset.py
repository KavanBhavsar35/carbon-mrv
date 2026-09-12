import os
import glob
from PIL import Image
import numpy as np

def inspect_satellite_data():
    dir21 = "data/satellite data/2021"
    dir24 = "data/satellite data/2024"
    
    print("=" * 75)
    print("      INSPECTING SATELLITE (EARTH ENGINE) DATASET: 2021 vs 2024")
    print("=" * 75)
    
    files21 = glob.glob(os.path.join(dir21, "*.png"))
    files24 = glob.glob(os.path.join(dir24, "*.png"))
    
    print(f"[*] Total files in 2021 folder: {len(files21)}")
    print(f"[*] Total files in 2024 folder: {len(files24)}")
    
    # Check 1..50 indexing
    missing21 = []
    missing24 = []
    corrupted = []
    pair_reports = []
    dimension_mismatches = 0
    alpha_issues = 0
    blank_images = 0
    
    for i in range(1, 51):
        f21 = os.path.join(dir21, f"image{i}.2021.png")
        f24 = os.path.join(dir24, f"image{i}.2024.png")
        
        if not os.path.exists(f21):
            missing21.append(f"image{i}.2021.png")
        if not os.path.exists(f24):
            missing24.append(f"image{i}.2024.png")
            
        if os.path.exists(f21) and os.path.exists(f24):
            try:
                im21 = Image.open(f21)
                im24 = Image.open(f24)
                
                s21 = im21.size
                s24 = im24.size
                
                arr21 = np.array(im21)
                arr24 = np.array(im24)
                
                # Check for blank / uniform images
                std21 = arr21[:, :, :3].std()
                std24 = arr24[:, :, :3].std()
                if std21 < 5.0 or std24 < 5.0:
                    blank_images += 1
                    
                # Check dimension difference
                if s21 != s24:
                    dimension_mismatches += 1
                    
                # Check alpha transparency
                if im21.mode == "RGBA" and np.any(arr21[:, :, 3] < 255):
                    alpha_issues += 1
                elif im24.mode == "RGBA" and np.any(arr24[:, :, 3] < 255):
                    alpha_issues += 1
                    
                # Spectral check
                r21, g21, b21 = arr21[:,:,0].astype(float), arr21[:,:,1].astype(float), arr21[:,:,2].astype(float)
                r24, g24, b24 = arr24[:,:,0].astype(float), arr24[:,:,1].astype(float), arr24[:,:,2].astype(float)
                
                green_ratio21 = g21.mean() / (r21.mean() + b21.mean() + 1e-5)
                green_ratio24 = g24.mean() / (r24.mean() + b24.mean() + 1e-5)
                
                pair_reports.append({
                    "id": i,
                    "size21": s21,
                    "size24": s24,
                    "mean_rgb21": (round(r21.mean(), 1), round(g21.mean(), 1), round(b21.mean(), 1)),
                    "mean_rgb24": (round(r24.mean(), 1), round(g24.mean(), 1), round(b24.mean(), 1)),
                    "green_ratio21": round(green_ratio21, 3),
                    "green_ratio24": round(green_ratio24, 3)
                })
            except Exception as e:
                corrupted.append((i, str(e)))
                
    print(f"[*] Exact Matched Pairs (1 to 50): {len(pair_reports)}/50")
    print(f"[*] Missing 2021 files: {missing21 if missing21 else 'None (all 50 present)'}")
    print(f"[*] Missing 2024 files: {missing24 if missing24 else 'None (all 50 present)'}")
    print(f"[*] Corrupted / Unreadable files: {corrupted if corrupted else 'None (all files read successfully)'}")
    print(f"[*] Blank / Low-contrast images: {blank_images}")
    print(f"[*] Dimension mismatch between 2021 & 2024: {dimension_mismatches}/50 pairs")
    print(f"[*] Transparent alpha pixels present: {alpha_issues} pairs")
    
    print("\n--- SAMPLE PAIR PROFILES (First 5 pairs) ---")
    for p in pair_reports[:5]:
        print(f"Pair {p['id']}:")
        print(f"  2021: Size={p['size21']} | RGB Mean={p['mean_rgb21']} | Greenness={p['green_ratio21']}")
        print(f"  2024: Size={p['size24']} | RGB Mean={p['mean_rgb24']} | Greenness={p['green_ratio24']}")
        
    print("=" * 75)

if __name__ == "__main__":
    inspect_satellite_data()
