import torch
import torch.nn as nn
import torch.nn.functional as F

class DoubleConv(nn.Module):
    """(Conv2D -> BatchNorm -> ReLU) * 2"""
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.conv(x)

class SatelliteRecoveryUNet(nn.Module):
    """
    Bi-Temporal U-Net architecture for satellite (Sentinel-2 / Earth Engine)
    mangrove canopy segmentation and multi-year recovery change detection.
    
    Accepts 6-channel input (2021 RGB + 2024 RGB) and outputs 3 semantic heads:
      1. Canopy 2021 mask logits
      2. Canopy 2024 mask logits
      3. Canopy Expansion / Recovery delta mask logits
    """
    def __init__(self, in_channels: int = 6, base_channels: int = 32):
        super().__init__()
        # Encoder
        self.enc1 = DoubleConv(in_channels, base_channels)
        self.enc2 = DoubleConv(base_channels, base_channels * 2)
        self.enc3 = DoubleConv(base_channels * 2, base_channels * 4)
        self.enc4 = DoubleConv(base_channels * 4, base_channels * 8)
        self.bottleneck = DoubleConv(base_channels * 8, base_channels * 16)
        
        self.pool = nn.MaxPool2d(2, 2)
        
        # Decoder
        self.up4 = nn.ConvTranspose2d(base_channels * 16, base_channels * 8, 2, stride=2)
        self.dec4 = DoubleConv(base_channels * 16, base_channels * 8)
        
        self.up3 = nn.ConvTranspose2d(base_channels * 8, base_channels * 4, 2, stride=2)
        self.dec3 = DoubleConv(base_channels * 8, base_channels * 4)
        
        self.up2 = nn.ConvTranspose2d(base_channels * 4, base_channels * 2, 2, stride=2)
        self.dec2 = DoubleConv(base_channels * 4, base_channels * 2)
        
        self.up1 = nn.ConvTranspose2d(base_channels * 2, base_channels, 2, stride=2)
        self.dec1 = DoubleConv(base_channels * 2, base_channels)
        
        # Multi-task heads
        self.head_2021 = nn.Conv2d(base_channels, 1, kernel_size=1)
        self.head_2024 = nn.Conv2d(base_channels, 1, kernel_size=1)
        self.head_delta = nn.Conv2d(base_channels, 1, kernel_size=1)

    def forward(self, x):
        # x is [B, 6, H, W] (first 3 channels = 2021 RGB, last 3 = 2024 RGB)
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        
        b = self.bottleneck(self.pool(e4))
        
        d4 = self.up4(b)
        d4 = torch.cat([d4, e4], dim=1)
        d4 = self.dec4(d4)
        
        d3 = self.up3(d4)
        d3 = torch.cat([d3, e3], dim=1)
        d3 = self.dec3(d3)
        
        d2 = self.up2(d3)
        d2 = torch.cat([d2, e2], dim=1)
        d2 = self.dec2(d2)
        
        d1 = self.up1(d2)
        d1 = torch.cat([d1, e1], dim=1)
        feat = self.dec1(d1)
        
        logits_2021 = self.head_2021(feat)
        logits_2024 = self.head_2024(feat)
        logits_delta = self.head_delta(feat)
        
        return {
            "logits_2021": logits_2021,
            "logits_2024": logits_2024,
            "logits_delta": logits_delta
        }
