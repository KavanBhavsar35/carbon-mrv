@echo off
echo ===================================================================
echo     Starting Bi-Temporal Satellite U-Net Model Training (10 Epochs)
echo ===================================================================
.venv\Scripts\python.exe -u ml\training\train_satellite_unet.py --epochs 10 --batch-size 4
pause
