import os
import glob
import random
import numpy as np
from PIL import Image
import torchvision.transforms.functional as TF

def compute_spectral_mask(img_rgb: np.ndarray, threshold: float = 0.12) -> np.ndarray:
    """
    Computes calibrated mangrove canopy mask using VARI + NIR-simulated greenness.
    """
    arr = img_rgb.astype(np.float32) / 255.0
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    # VARI: (G - R) / (G + R - B)
    denom = g + r - b
    denom[np.abs(denom) < 1e-5] = 1e-5
    vari = (g - r) / denom
    
    # Simulated NIR-green contrast
    ndvi_sim = (g - r) / (g + r + 1e-5)
    
    combined = 0.6 * vari + 0.4 * ndvi_sim
    mask = (combined > threshold).astype(np.uint8) * 255
    return mask

def preprocess_satellite_dataset(
    dir21="data/satellite data/2021",
    dir24="data/satellite data/2024",
    output_dir="data/processed_satellite",
    target_size=(256, 256),
    split_ratio=0.75,
    seed=42
):
    random.seed(seed)
    np.random.seed(seed)
    
    print("=" * 75)
    print("      PREPROCESSING SATELLITE (EARTH ENGINE) DATASET (2021 vs 2024)")
    print("=" * 75)
    
    # Match all 50 pairs
    pairs = []
    for i in range(1, 51):
        f21 = os.path.join(dir21, f"image{i}.2021.png")
        f24 = os.path.join(dir24, f"image{i}.2024.png")
        if os.path.exists(f21) and os.path.exists(f24):
            pairs.append((i, f21, f24))
            
    total_pairs = len(pairs)
    print(f"[*] Found {total_pairs} matched satellite pairs (2021 & 2024)")
    
    # Train / Test split (75% / 25%)
    indices = list(range(total_pairs))
    random.shuffle(indices)
    
    train_count = int(round(total_pairs * split_ratio))
    test_count = total_pairs - train_count
    print(f"[*] Dataset Split: 75% Train = {train_count} pairs | 25% Test = {test_count} pairs")
    
    splits = {
        "train": [pairs[i] for i in indices[:train_count]],
        "test": [pairs[i] for i in indices[train_count:]]
    }
    
    # Create directory structure
    subdirs = ["images_2021", "images_2024", "masks_2021", "masks_2024", "masks_delta"]
    for split_name in ["train", "test"]:
        for sd in subdirs:
            os.makedirs(os.path.join(output_dir, split_name, sd), exist_ok=True)
            
    stats = {
        "train_expansion_pct": [],
        "test_expansion_pct": []
    }
    
    for split_name, pair_list in splits.items():
        print(f"\n[*] Processing {split_name.upper()} split ({len(pair_list)} pairs)...")
        for pair_id, p21, p24 in pair_list:
            fname = f"pair_{pair_id:02d}.png"
            
            # Load images as RGB (discarding alpha)
            im21 = Image.open(p21).convert("RGB")
            im24 = Image.open(p24).convert("RGB")
            
            # Resize to target uniform dimension
            im21_res = im21.resize(target_size, Image.BILINEAR)
            im24_res = im24.resize(target_size, Image.BILINEAR)
            
            arr21 = np.array(im21_res)
            arr24 = np.array(im24_res)
            
            # Compute ground truth canopy masks
            mask21 = compute_spectral_mask(arr21)
            mask24 = compute_spectral_mask(arr24)
            
            # Delta / Expansion mask: new mangrove growth in 2024 not present in 2021
            mask_delta = np.maximum(0, mask24.astype(int) - mask21.astype(int)).astype(np.uint8)
            
            # Save preprocessed images and masks
            im21_res.save(os.path.join(output_dir, split_name, "images_2021", fname))
            im24_res.save(os.path.join(output_dir, split_name, "images_2024", fname))
            Image.fromarray(mask21).save(os.path.join(output_dir, split_name, "masks_2021", fname))
            Image.fromarray(mask24).save(os.path.join(output_dir, split_name, "masks_2024", fname))
            Image.fromarray(mask_delta).save(os.path.join(output_dir, split_name, "masks_delta", fname))
            
            # Stats
            canopy21 = np.sum(mask21 > 0)
            canopy24 = np.sum(mask24 > 0)
            delta_px = np.sum(mask_delta > 0)
            growth_pct = ((canopy24 - canopy21) / (canopy21 + 1e-5)) * 100.0
            
            if split_name == "train":
                stats["train_expansion_pct"].append(growth_pct)
            else:
                stats["test_expansion_pct"].append(growth_pct)
                
    print("\n" + "=" * 75)
    print("      PREPROCESSING SUMMARY")
    print("=" * 75)
    print(f"[*] Train Set: {train_count} pairs, average canopy expansion: {np.mean(stats['train_expansion_pct']):+.1f}%")
    print(f"[*] Test Set:  {test_count} pairs, average canopy expansion: {np.mean(stats['test_expansion_pct']):+.1f}%")
    print(f"[*] Clean uniform dimensions: {target_size[0]}x{target_size[1]} RGB")
    print(f"[*] Saved to: {os.path.abspath(output_dir)}")
    print("=" * 75)

if __name__ == "__main__":
    preprocess_satellite_dataset()
