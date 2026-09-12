import os
import glob
import numpy as np
from PIL import Image

def analyze_uav_data(data_dir="data/mangrove_uav_data"):
    image_files = sorted(glob.glob(os.path.join(data_dir, "*.png")))
    print(f"Total UAV images found: {len(image_files)}")
    
    annotated_count = 0
    unannotated_count = 0
    sizes = set()
    yellow_pixel_stats = []
    
    for idx, img_path in enumerate(image_files):
        with Image.open(img_path) as img:
            sizes.add(img.size)
            arr = np.array(img)
            
            # Yellow in RGB is high Red, high Green, low Blue
            # Let's test a generous threshold for yellow contours
            if arr.ndim == 3 and arr.shape[2] >= 3:
                r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
                yellow_mask = (r > 160) & (g > 160) & (b < 120) & (np.abs(r.astype(int) - g.astype(int)) < 50)
                yellow_px = np.sum(yellow_mask)
                
                # Check for other annotation colors if any (cyan, magenta, green, red, blue)
                cyan_mask = (r < 100) & (g > 180) & (b > 180)
                cyan_px = np.sum(cyan_mask)
                
                total_annot_px = yellow_px + cyan_px
                if total_annot_px > 100:
                    annotated_count += 1
                    yellow_pixel_stats.append(total_annot_px)
                else:
                    unannotated_count += 1
            else:
                unannotated_count += 1

    print(f"Image dimensions found: {sizes}")
    print(f"Images with detectable annotation contours: {annotated_count}/{len(image_files)}")
    print(f"Images without contour lines (or negative samples): {unannotated_count}")
    if yellow_pixel_stats:
        print(f"Annotation contour pixel count range: min={min(yellow_pixel_stats)}, max={max(yellow_pixel_stats)}, mean={np.mean(yellow_pixel_stats):.1f}")

if __name__ == "__main__":
    analyze_uav_data()
