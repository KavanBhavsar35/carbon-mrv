import numpy as np

def compute_vegetation_index(image_rgb: np.ndarray, index_type: str = "VARI") -> np.ndarray:
    """
    Computes vegetation spectral index from normalized RGB array [0, 1].
    VARI (Visible Atmospherically Resistant Index): (G - R) / (G + R - B + eps)
    ExG (Excess Green): 2*G - R - B
    Returns float 2D array normalized roughly to [-1, 1] or [0, 1].
    """
    R = image_rgb[:, :, 0]
    G = image_rgb[:, :, 1]
    B = image_rgb[:, :, 2]
    eps = 1e-6

    if index_type == "VARI":
        denom = G + R - B
        # avoid division by zero
        denom = np.where(np.abs(denom) < eps, eps, denom)
        vari = (G - R) / denom
        return np.clip(vari, -1.0, 1.0)
    elif index_type == "ExG":
        exg = 2.0 * G - R - B
        return np.clip(exg, -1.0, 1.0)
    elif index_type == "NDVI_SIMULATED":
        # Simulates NIR from green-red gradient for standard drone RGB
        nir_sim = np.clip(G * 1.5 - R * 0.5, 0.0, 1.0)
        ndvi = (nir_sim - R) / (nir_sim + R + eps)
        return np.clip(ndvi, -1.0, 1.0)
    else:
        # Default greenness ratio
        return G / (R + G + B + eps)
