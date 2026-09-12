import io
import os
import numpy as np
from PIL import Image, ImageDraw

def create_synthetic_mangrove_image(
    filename: str,
    canopy_coverage_pct: float = 65.0,
    size: tuple = (512, 512),
    seed: int = 42
) -> str:
    """
    Generates a realistic synthetic coastal drone image showing mangrove canopy
    interspersed with tidal water channels and mudflats.
    Saves image to ml/data/<filename> and returns file path.
    """
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    rng = np.random.default_rng(seed)

    # Base background: coastal tidal water & sediment mudflat
    # Water: deep greenish-blue (R: 35, G: 65, B: 75)
    img_data = np.zeros((size[0], size[1], 3), dtype=np.uint8)
    img_data[:, :, 0] = rng.integers(25, 45, size=size)
    img_data[:, :, 1] = rng.integers(55, 80, size=size)
    img_data[:, :, 2] = rng.integers(65, 95, size=size)

    img = Image.fromarray(img_data)
    draw = ImageDraw.Draw(img)

    # Draw mangrove canopy clusters
    # Mangrove foliage: lush deep green with varied density (R: 20-50, G: 110-180, B: 25-60)
    num_clusters = int(canopy_coverage_pct * 12)
    center_x, center_y = size[0] // 2, size[1] // 2
    spread = size[0] * 0.42

    for _ in range(num_clusters):
        cx = int(np.clip(rng.normal(center_x, spread * 0.6), 40, size[0] - 40))
        cy = int(np.clip(rng.normal(center_y, spread * 0.6), 40, size[1] - 40))
        radius = int(rng.uniform(10, 35))

        r = int(rng.integers(20, 50))
        g = int(rng.integers(115, 175))
        b = int(rng.integers(30, 60))

        draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(r, g, b))

    img.save(filename, format="PNG")
    return filename

def generate_all_demo_data(data_dir: str = None) -> dict:
    if not data_dir:
        data_dir = os.path.join(os.path.dirname(__file__))
    os.makedirs(data_dir, exist_ok=True)

    # Demo 1: Project A (Legitimate Mangrove Restoration)
    # Baseline: 10.2 ha (~52% cover)
    p1_base = os.path.join(data_dir, "project_a_baseline_2024.png")
    create_synthetic_mangrove_image(p1_base, canopy_coverage_pct=52.0, seed=101)

    # Current: 12.4 ha (~68% cover, +21.57% gain)
    p1_curr = os.path.join(data_dir, "project_a_current_2026.png")
    create_synthetic_mangrove_image(p1_curr, canopy_coverage_pct=68.0, seed=102)

    # Demo 2: Project B (Suspicious Project with slight growth)
    p2_base = os.path.join(data_dir, "project_b_baseline_2024.png")
    create_synthetic_mangrove_image(p2_base, canopy_coverage_pct=40.0, seed=201)

    p2_curr = os.path.join(data_dir, "project_b_current_2026.png")
    create_synthetic_mangrove_image(p2_curr, canopy_coverage_pct=42.5, seed=202)

    return {
        "project_a_baseline": p1_base,
        "project_a_current": p1_curr,
        "project_b_baseline": p2_base,
        "project_b_current": p2_curr,
    }

if __name__ == "__main__":
    generate_all_demo_data()
    print("Demo synthetic datasets generated successfully.")
