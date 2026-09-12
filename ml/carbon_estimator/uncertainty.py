from typing import Tuple

def compute_uncertainty_bounds(
    estimated_tco2e: float,
    sigma_relative: float = 0.07,
    confidence_level: float = 0.95
) -> Tuple[float, float, float]:
    """
    Computes statistical bounds [lower_bound, upper_bound] at specified confidence level.
    For 95% confidence interval: z = 1.96.
    Returns:
        lower_bound: float
        upper_bound: float
        confidence: float
    """
    if estimated_tco2e <= 0:
        return 0.0, 0.0, 0.5

    # z-score for 95% two-tailed Gaussian distribution
    z = 1.96 if confidence_level >= 0.95 else 1.645
    margin = estimated_tco2e * (z * sigma_relative)

    lower_bound = max(0.0, estimated_tco2e - margin)
    upper_bound = estimated_tco2e + margin

    # Model confidence score derived from uncertainty envelope
    confidence_score = max(0.70, min(0.98, 1.0 - (2 * sigma_relative)))

    return round(lower_bound, 2), round(upper_bound, 2), round(confidence_score, 3)
