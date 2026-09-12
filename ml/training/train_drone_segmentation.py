import os
import sys
import glob
import time
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import torchvision.transforms.functional as TF

# Add workspace root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from ml.models.unet import MangroveUNet

class MangroveUAVDataset(Dataset):
    def __init__(self, data_dir: str, split: str = "train", img_size: int = 256, is_training: bool = True):
        self.img_dir = os.path.join(data_dir, split, "images")
        self.mask_dir = os.path.join(data_dir, split, "masks")
        self.image_paths = sorted(glob.glob(os.path.join(self.img_dir, "*.png")))
        self.img_size = img_size
        self.is_training = is_training
        
    def __len__(self):
        return len(self.image_paths)
        
    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        filename = os.path.basename(img_path)
        mask_path = os.path.join(self.mask_dir, filename)
        
        # Load image & mask
        img = Image.open(img_path).convert("RGB")
        mask = Image.open(mask_path).convert("L")
        
        # Resize to training dimensions
        img = TF.resize(img, [self.img_size, self.img_size], interpolation=TF.InterpolationMode.BILINEAR)
        mask = TF.resize(mask, [self.img_size, self.img_size], interpolation=TF.InterpolationMode.NEAREST)
        
        # Augmentations for training
        if self.is_training:
            if np.random.rand() > 0.5:
                img = TF.hflip(img)
                mask = TF.hflip(mask)
            if np.random.rand() > 0.5:
                img = TF.vflip(img)
                mask = TF.vflip(mask)
                
        # To Tensors
        img_tensor = TF.to_tensor(img) # [3, H, W], normalized to [0, 1]
        mask_tensor = (TF.to_tensor(mask) > 0.5).float() # [1, H, W]
        
        return img_tensor, mask_tensor

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

def train_model(
    data_dir="data/processed_uav",
    epochs=10,
    batch_size=8,
    learning_rate=1e-3,
    output_checkpoint="ml/models/mangrove_drone_weights.pt"
):
    print("=" * 75)
    print("      MANGROVE UAV DRONE SEGMENTATION & CARBON MODEL TRAINING")
    print("=" * 75)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Compute Device: {device}")
    
    # Datasets and loaders
    train_dataset = MangroveUAVDataset(data_dir, split="train", img_size=256, is_training=True)
    test_dataset = MangroveUAVDataset(data_dir, split="test", img_size=256, is_training=False)
    
    print(f"[*] Dataset Split: 75% Train ({len(train_dataset)} images) | 25% Test ({len(test_dataset)} images)")
    print(f"[*] Total Epochs: {epochs} | Batch Size: {batch_size} | Learning Rate: {learning_rate}")
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, drop_last=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    # Model, Optimizer, Criterion
    model = MangroveUNet(in_channels=3, out_channels=1, base_features=32).to(device)
    bce_fn = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    
    best_val_iou = 0.0
    start_time = time.time()
    
    print("-" * 75)
    print(f"{'Epoch':<8} | {'Train Loss':<12} | {'Train IoU':<10} | {'Val Loss':<10} | {'Val IoU':<10} | {'Val Dice':<10} | {'Time'}")
    print("-" * 75)
    
    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        
        # --- TRAINING ---
        model.train()
        train_losses = []
        train_ious = []
        
        for images, masks in train_loader:
            images, masks = images.to(device), masks.to(device)
            optimizer.zero_grad()
            
            logits = model(images)
            loss_bce = bce_fn(logits, masks)
            loss_dice = dice_loss(logits, masks)
            total_loss = 0.5 * loss_bce + 0.5 * loss_dice
            
            total_loss.backward()
            optimizer.step()
            
            train_losses.append(total_loss.item())
            train_ious.append(compute_iou(logits, masks))
            
        scheduler.step()
        
        # --- EVALUATION (25% TEST SET) ---
        model.eval()
        val_losses = []
        val_ious = []
        val_dices = []
        
        with torch.no_grad():
            for images, masks in test_loader:
                images, masks = images.to(device), masks.to(device)
                logits = model(images)
                
                loss_bce = bce_fn(logits, masks)
                loss_dice = dice_loss(logits, masks)
                val_loss = 0.5 * loss_bce + 0.5 * loss_dice
                
                val_losses.append(val_loss.item())
                val_ious.append(compute_iou(logits, masks))
                val_dices.append(compute_dice(logits, masks))
                
        avg_train_loss = np.mean(train_losses)
        avg_train_iou = np.mean(train_ious)
        avg_val_loss = np.mean(val_losses)
        avg_val_iou = np.mean(val_ious)
        avg_val_dice = np.mean(val_dices)
        epoch_dur = time.time() - epoch_start
        
        # Save best model
        if avg_val_iou > best_val_iou:
            best_val_iou = avg_val_iou
            os.makedirs(os.path.dirname(output_checkpoint), exist_ok=True)
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_iou": avg_val_iou,
                "val_dice": avg_val_dice,
                "val_loss": avg_val_loss,
            }, output_checkpoint)
            saved_indicator = " [*Best]"
        else:
            saved_indicator = ""
            
        print(f"{epoch:>2}/{epochs:<4} | {avg_train_loss:>10.4f}   | {avg_train_iou:>8.4f}   | {avg_val_loss:>8.4f}   | {avg_val_iou:>8.4f}   | {avg_val_dice:>8.4f}   | {epoch_dur:>4.1f}s{saved_indicator}")
        sys.stdout.flush()

    total_time = time.time() - start_time
    print("-" * 75)
    print(f"[SUCCESS] Training complete in {total_time:.1f} seconds.")
    print(f"[SUCCESS] Best Validation IoU: {best_val_iou:.4f}")
    print(f"[SUCCESS] Model weights saved to: {os.path.abspath(output_checkpoint)}")
    
    # --- CARBON CREDIT PREDICTION DEMO FROM TRAINED MODEL ---
    print("\n" + "=" * 75)
    print("      CARBON CREDIT INFERENCE ESTIMATION (BLUE CARBON ALLOMETRY)")
    print("=" * 75)
    
    # Load best checkpoint
    checkpoint = torch.load(output_checkpoint, map_location=device, weights_only=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    
    # Run test sample inference
    with torch.no_grad():
        test_images, test_masks = next(iter(test_loader))
        test_images = test_images.to(device)
        logits = model(test_images)
        preds = (torch.sigmoid(logits) > 0.5).float().cpu().numpy()
        
    sample_mask = preds[0, 0]
    total_px = sample_mask.size
    crown_px = int(np.sum(sample_mask))
    coverage_pct = (crown_px / total_px) * 100.0
    
    # Biophysical / Allometric Carbon Calculation:
    # Drone Ground Sampling Distance (GSD): e.g. 0.05m / px (5cm/px) for UAV drone
    gsd_m = 0.05
    pixel_area_m2 = gsd_m * gsd_m
    canopy_area_m2 = crown_px * pixel_area_m2
    canopy_area_ha = canopy_area_m2 / 10000.0
    
    # IPCC Tier-2 Mangrove Allometry:
    # Aboveground biomass (AGB) ~ 150-250 t/ha for mature Rhizophora / Avicennia
    # Belowground biomass factor (BGB/AGB) ~ 0.49
    # Carbon fraction of biomass = 0.47
    # Carbon to CO2 conversion factor = 44 / 12 = 3.667
    mean_agb_t_per_ha = 180.0
    total_agb = canopy_area_ha * mean_agb_t_per_ha
    total_bgb = total_agb * 0.49
    total_biomass = total_agb + total_bgb
    carbon_t = total_biomass * 0.47
    co2_sequestered_tco2e = carbon_t * (44.0 / 12.0)
    
    # Count tree crowns using connected components
    from scipy.ndimage import label
    labeled_crowns, num_trees = label(sample_mask)
    
    print(f"[*] Sample Test Image Analysis:")
    print(f"    - Segmented Tree Crown Pixels: {crown_px:,} / {total_px:,} ({coverage_pct:.1f}% canopy)")
    print(f"    - Individual Mangrove Tree Count: {num_trees} individual crowns")
    print(f"    - Ground Sampling Distance (GSD): {gsd_m*100:.1f} cm/pixel")
    print(f"    - Measured Canopy Area: {canopy_area_m2:.2f} m^2 ({canopy_area_ha:.6f} ha)")
    print(f"    - Total Biomass (AGB + BGB): {total_biomass:.4f} metric tons")
    print(f"    - Estimated Carbon Stock: {carbon_t:.4f} tC")
    print(f"    - Estimated Carbon Credit Yield: {co2_sequestered_tco2e:.4f} tCO2e per survey frame")
    print("=" * 75)

if __name__ == "__main__":
    train_model(epochs=10, batch_size=8)
