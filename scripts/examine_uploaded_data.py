import os
import sys
import glob
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.models.segmentation import MangroveSegmentationModel
from ml.inference.change_detection import TemporalChangeDetector
from ml.carbon_estimator.estimator import CarbonEstimator
from ml.anomaly_detection.detector import ClaimAnomalyDetector
from shared.schemas.models import ProjectType

def examine():
    dir_2021 = "data/carbon photo 2021"
    dir_2024 = "data/carbon photo 2024"

    if not os.path.exists(dir_2021) or not os.path.exists(dir_2024):
        print("Data directories not found!")
        return

    files_2021 = sorted(os.listdir(dir_2021))
    files_2024 = sorted(os.listdir(dir_2024))

    print("=" * 70)
    print(" EXAMINING UPLOADED SATELLITE SCREENSHOT DATASET")
    print("=" * 70)
    print(f"2021 folder: {len(files_2021)} images")
    print(f"2024 folder: {len(files_2024)} images")

    # Inspect first 5 images for dimensions, color, and alpha channel
    print("\n--- Image Properties (Sample of 5 from each) ---")
    for year, files, d_path in [("2021", files_2021, dir_2021), ("2024", files_2024, dir_2024)]:
        print(f"\nYear {year}:")
        for i, fname in enumerate(files[:5]):
            fpath = os.path.join(d_path, fname)
            img = Image.open(fpath)
            arr = np.array(img)
            has_alpha = img.mode == 'RGBA'
            # Check corner pixels to see if there are UI borders or transparent padding
            corners = [arr[0, 0], arr[0, -1], arr[-1, 0], arr[-1, -1]]
            print(f"  [{i+1}] {fname} | Size: {img.size} | Mode: {img.mode} | RGB mean: {[round(x, 1) for x in arr[:,:,:3].mean(axis=(0,1))]}")

    # Run through the ML model pipeline
    print("\n--- Testing Model Predictions On First 6 Pairs ---")
    model = MangroveSegmentationModel()
    detector = TemporalChangeDetector(model)
    estimator = CarbonEstimator()
    anomaly_detector = ClaimAnomalyDetector()

    results = []
    num_pairs = min(len(files_2021), len(files_2024), 8)

    for i in range(num_pairs):
        p21 = os.path.join(dir_2021, files_2021[i])
        p24 = os.path.join(dir_2024, files_2024[i])

        change = detector.analyze_change(p21, p24)
        carb = estimator.estimate_carbon(change["current_area_ha"], ProjectType.MANGROVE)
        
        # Test claim verification assuming issuer reports close to carbon estimate
        sim_reported = round(carb["estimated_tco2e"] * 0.95, 1)
        verif = anomaly_detector.verify_claim(
            project_id=f"PLOT-{i+1}",
            reported_tco2e=sim_reported,
            estimated_tco2e=carb["estimated_tco2e"],
            project_area_hectares=change["current_area_ha"],
            vegetation_change_pct=change["change_percent"]
        )

        results.append({
            "pair": i + 1,
            "f2021": files_2021[i],
            "f2024": files_2024[i],
            "area_2021": change["baseline_area_ha"],
            "area_2024": change["current_area_ha"],
            "change_ha": change["change_ha"],
            "change_pct": change["change_percent"],
            "trend": change["trend"],
            "conf": change["confidence"],
            "est_tco2e": carb["estimated_tco2e"],
            "risk": verif["risk_level"]
        })

        print(f"Pair {i+1} ({files_2021[i][:18]}.. vs {files_2024[i][:18]}..):")
        print(f"   2021 Area: {change['baseline_area_ha']} ha ({change['baseline_vegetation_pct']}%)")
        print(f"   2024 Area: {change['current_area_ha']} ha ({change['current_vegetation_pct']}%)")
        print(f"   Net Change: {change['change_ha']:+} ha ({change['change_percent']:+}%) -> Trend: {change['trend']}")
        print(f"   Carbon Est: {carb['estimated_tco2e']} tCO2e [CI: {carb['lower_bound_tco2e']} - {carb['upper_bound_tco2e']}]")
        print(f"   ML Risk Level: {verif['risk_level']} (Score: {verif['verification_score']})")

    return results

if __name__ == "__main__":
    examine()
