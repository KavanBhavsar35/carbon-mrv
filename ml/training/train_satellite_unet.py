import os
import sys
import glob
import time
import argparse
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import torchvision.transforms.functional as TF

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from ml.models.satellite_unet import SatelliteRecoveryUNet

class SatellitePairDataset(Dataset):
    def __init__(self, data_dir="data/processed_satellite", split="train", is_training=True):
        self.dir_2021 = os.path.join(data_dir, split, "images_2021")
        self.dir_2024 = os.path.join(data_dir, split, "images_2024")
        self.mask_dir_2021 = os.path.join(data_dir, split, "masks_2021")
        self.mask_dir_2024 = os.path.join(data_dir, split, "masks_2024")
        self.mask_dir_delta = os.path.join(data_dir, split, "masks_delta")
        
        self.filenames = sorted([os.path.basename(p) for p in glob.glob(os.path.join(self.dir_2021, "*.png"))])
        self.is_training = is_training
        
    def __len__(self):
        return len(self.filenames)
        
    def __getitem__(self, idx):
        fn = self.filenames[idx]
        
        im21 = Image.open(os.path.join(self.dir_2021, fn)).convert("RGB")
        im24 = Image.open(os.path.join(self.dir_2024, fn)).convert("RGB")
        m21 = Image.open(os.path.join(self.mask_dir_2021, fn)).convert("L")
        m24 = Image.open(os.path.join(self.mask_dir_2024, fn)).convert("L")
        mdelta = Image.open(os.path.join(self.mask_dir_delta, fn)).convert("L")
        
        # Spatial augmentation
        if self.is_training:
            if np.random.rand() > 0.5:
                im21 = TF.hflip(im21)
                im24 = TF.hflip(im24)
                m21 = TF.hflip(m21)
                m24 = TF.hflip(m24)
                mdelta = TF.hflip(mdelta)
            if np.random.rand() > 0.5:
                im21 = TF.vflip(im21)
                im24 = TF.vflip(im24)
                m21 = TF.vflip(m21)
                m24 = TF.vflip(m24)
                mdelta = TF.vflip(mdelta)
                
        # To Tensors
        t21 = TF.to_tensor(im21)
        t24 = TF.to_tensor(im24)
        input_6ch = torch.cat([t21, t24], dim=0) # [6, H, W]
        
        tm21 = (TF.to_tensor(m21) > 0.5).float()
        tm24 = (TF.to_tensor(m24) > 0.5).float()
        tmdelta = (TF.to_tensor(mdelta) > 0.5).float()
        
        return input_6ch, tm21, tm24, tmdelta

def dice_loss(pred_logits, targets, smooth=1e-5):
    probs = torch.sigmoid(pred_logits)
    intersection = (probs * targets).sum(dim=(2, 3))
    union = probs.sum(dim=(2, 3)) + targets.sum(dim=(2, 3))
    dice = (2.0 * intersection + smooth) / (union + smooth)
    return 1.0 - dice.mean()

def compute_iou(pred_logits, targets, threshold=0.5, smooth=1e-5):
    probs = torch.sigmoid(pred_logits)
    preds = (probs > threshold).float()
    intersection = (preds * targets).sum(dim=(2, 3))
    union = preds.sum(dim=(2, 3)) + targets.sum(dim=(2, 3)) - intersection
    iou = (intersection + smooth) / (union + smooth)
    return iou.mean().item()

def compute_dice(pred_logits, targets, threshold=0.5, smooth=1e-5):
    probs = torch.sigmoid(pred_logits)
    preds = (probs > threshold).float()
    intersection = (preds * targets).sum(dim=(2, 3))
    union = preds.sum(dim=(2, 3)) + targets.sum(dim=(2, 3))
    dice = (2.0 * intersection + smooth) / (union + smooth)
    return dice.mean().item()

def train_satellite_model(
    epochs=10,
    batch_size=4,
    learning_rate=1e-3,
    data_dir="data/processed_satellite",
    output_checkpoint="ml/models/mangrove_satellite_unet.pt"
):
    print("=" * 80)
    print("   SATELLITE BI-TEMPORAL MANGROVE RECOVERY & EXPANSION U-NET TRAINING")
    print("=" * 80)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Compute Device: {device}")
    
    train_ds = SatellitePairDataset(data_dir=data_dir, split="train", is_training=True)
    test_ds = SatellitePairDataset(data_dir=data_dir, split="test", is_training=False)
    
    print(f"[*] Dataset Split: 75% Train ({len(train_ds)} pairs) | 25% Test ({len(test_ds)} pairs)")
    print(f"[*] Total Epochs: {epochs} | Batch Size: {batch_size} | Learning Rate: {learning_rate}")
    
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)
    
    model = SatelliteRecoveryUNet(in_channels=6, base_channels=32).to(device)
    bce_fn = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    
    best_val_iou = 0.0
    start_time = time.time()
    
    print("-" * 80)
    print(f"{'Epoch':<8} | {'Train Loss':<11} | {'Train IoU':<10} | {'Val Loss':<9} | {'Val 2024 IoU':<13} | {'Val Delta IoU':<14} | {'Time'}")
    print("-" * 80)
    sys.stdout.flush()
    
    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        
        # --- TRAIN ---
        model.train()
        train_losses = []
        train_ious_2024 = []
        
        for inputs, tm21, tm24, tmdelta in train_loader:
            inputs, tm21, tm24, tmdelta = inputs.to(device), tm21.to(device), tm24.to(device), tmdelta.to(device)
            optimizer.zero_grad()
            
            out = model(inputs)
            l21 = 0.5 * bce_fn(out["logits_2021"], tm21) + 0.5 * dice_loss(out["logits_2021"], tm21)
            l24 = 0.5 * bce_fn(out["logits_2024"], tm24) + 0.5 * dice_loss(out["logits_2024"], tm24)
            ldelta = 0.5 * bce_fn(out["logits_delta"], tmdelta) + 0.5 * dice_loss(out["logits_delta"], tmdelta)
            
            total_loss = l21 + l24 + 1.5 * ldelta
            total_loss.backward()
            optimizer.step()
            
            train_losses.append(total_loss.item())
            train_ious_2024.append(compute_iou(out["logits_2024"], tm24))
            
        scheduler.step()
        
        # --- EVAL (25% TEST SET) ---
        model.eval()
        val_losses = []
        val_ious_2024 = []
        val_ious_delta = []
        
        with torch.no_grad():
            for inputs, tm21, tm24, tmdelta in test_loader:
                inputs, tm21, tm24, tmdelta = inputs.to(device), tm21.to(device), tm24.to(device), tmdelta.to(device)
                out = model(inputs)
                
                l21 = 0.5 * bce_fn(out["logits_2021"], tm21) + 0.5 * dice_loss(out["logits_2021"], tm21)
                l24 = 0.5 * bce_fn(out["logits_2024"], tm24) + 0.5 * dice_loss(out["logits_2024"], tm24)
                ldelta = 0.5 * bce_fn(out["logits_delta"], tmdelta) + 0.5 * dice_loss(out["logits_delta"], tmdelta)
                
                val_losses.append((l21 + l24 + 1.5 * ldelta).item())
                val_ious_2024.append(compute_iou(out["logits_2024"], tm24))
                val_ious_delta.append(compute_iou(out["logits_delta"], tmdelta))
                
        avg_train_loss = np.mean(train_losses)
        avg_train_iou = np.mean(train_ious_2024)
        avg_val_loss = np.mean(val_losses)
        avg_val_iou_2024 = np.mean(val_ious_2024)
        avg_val_iou_delta = np.mean(val_ious_delta)
        dur = time.time() - epoch_start
        
        if avg_val_iou_2024 > best_val_iou:
            best_val_iou = avg_val_iou_2024
            os.makedirs(os.path.dirname(output_checkpoint), exist_ok=True)
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_iou_2024": avg_val_iou_2024,
                "val_iou_delta": avg_val_iou_delta,
                "val_loss": avg_val_loss
            }, output_checkpoint)
            indicator = " [*Best]"
        else:
            indicator = ""
            
        print(f"{epoch:>2}/{epochs:<4} | {avg_train_loss:>9.4f}   | {avg_train_iou:>8.4f}   | {avg_val_loss:>7.4f}   | {avg_val_iou_2024:>11.4f}   | {avg_val_iou_delta:>12.4f}   | {dur:>4.1f}s{indicator}")
        sys.stdout.flush()

    total_time = time.time() - start_time
    print("-" * 80)
    print(f"[SUCCESS] Training complete in {total_time:.1f} seconds.")
    print(f"[SUCCESS] Best Satellite Validation IoU: {best_val_iou:.4f}")
    print(f"[SUCCESS] Satellite U-Net weights saved to: {os.path.abspath(output_checkpoint)}")
    
    # --- TEST PREDICTION & BLUE CARBON YIELD EVALUATION ---
    print("\n" + "=" * 80)
    print("      SATELLITE RECOVERY & CARBON OFFSET CALCULATION (2021 vs 2024)")
    print("=" * 80)
    
    ckpt = torch.load(output_checkpoint, map_location=device, weights_only=False)
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()
    
    # Run test sample inference
    with torch.no_grad():
        inputs, tm21, tm24, tmdelta = next(iter(test_loader))
        inputs = inputs.to(device)
        out = model(inputs)
        
        pred_2021 = (torch.sigmoid(out["logits_2021"]) > 0.5).float().cpu().numpy()[0, 0]
        pred_2024 = (torch.sigmoid(out["logits_2024"]) > 0.5).float().cpu().numpy()[0, 0]
        pred_delta = (torch.sigmoid(out["logits_delta"]) > 0.5).float().cpu().numpy()[0, 0]
        
    # Sentinel-2 Pixel Resolution = 10m per pixel (100 m^2 per pixel)
    pixel_area_m2 = 10.0 * 10.0
    
    px_2021 = int(np.sum(pred_2021))
    px_2024 = int(np.sum(pred_2024))
    px_delta = int(np.sum(pred_delta))
    
    area_ha_2021 = (px_2021 * pixel_area_m2) / 10000.0
    area_ha_2024 = (px_2024 * pixel_area_m2) / 10000.0
    expansion_ha = (px_delta * pixel_area_m2) / 10000.0
    expansion_pct = ((area_ha_2024 - area_ha_2021) / (area_ha_2021 + 1e-5)) * 100.0
    
    # Blue Carbon Factor (IPCC Tier-2 for mangrove expansion over 3 years)
    # Mean annual sequestration: ~9.5 tCO2e/ha/year * 3 years = ~28.5 tCO2e/ha net growth
    co2e_credits = max(0.0, expansion_ha * 28.5)
    
    print(f"[*] Satellite Sample Analysis (Sentinel-2 10m GSD):")
    print(f"    - Baseline Canopy 2021:       {area_ha_2021:.2f} ha ({px_2021:,} pixels)")
    print(f"    - Current Canopy 2024:        {area_ha_2024:.2f} ha ({px_2024:,} pixels)")
    print(f"    - Net Expansion (3-Year):     +{expansion_ha:.2f} ha (+{expansion_pct:.1f}% growth)")
    print(f"    - Annual Sequestration Rate:  9.5 tCO2e / ha / year")
    print(f"    - Net Carbon Credit Issued:   {co2e_credits:.2f} tCO2e credits")
    print("=" * 80)
    sys.stdout.flush()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=10, help="Number of epochs to train")
    parser.add_argument("--batch-size", type=int, default=4, help="Batch size")
    args = parser.parse_args()
    
    train_satellite_model(epochs=args.epochs, batch_size=args.batch_size)
