@echo off
echo ===================================================================
echo     Starting UAV Drone Mangrove U-Net Model Training (10 Epochs)
echo ===================================================================
.venv\Scripts\python.exe -u ml\training\train_drone_segmentation.py
pause
