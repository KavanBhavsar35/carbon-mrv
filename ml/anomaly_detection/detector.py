import numpy as np
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest
from shared.schemas.models import RiskLevel

class ClaimAnomalyDetector:
    """
    ML Claim Anomaly & Fraud Detection Engine.
    Combines an Isolation Forest trained on multivariate carbon claim distributions
    with domain-informed rule heuristics to compute verification and anomaly risk scores.
    """
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.10,
            random_state=42
        )
        self._fit_baseline_distribution()

    def _fit_baseline_distribution(self):
        """
        Fits baseline Isolation Forest on synthetic reference distribution
        of legitimate nature-based carbon projects.
        Features: [project_area, reported_tco2e, ml_estimated_tco2e, diff_ratio, veg_change_pct]
        """
        rng = np.random.default_rng(42)
        n_samples = 400

        # Normal realistic claims: reported is within +/- 15% of ML estimate
        area = rng.uniform(5.0, 50.0, size=n_samples)
        density = rng.uniform(7.0, 14.0, size=n_samples) # tCO2e / ha
        estimated = area * density
        ratio = rng.normal(0.98, 0.08, size=n_samples)
        reported = estimated * ratio
        diff_ratio = (reported - estimated) / estimated
        veg_change = rng.normal(15.0, 10.0, size=n_samples)

        normal_features = np.column_stack([area, reported, estimated, diff_ratio, veg_change])

        # Add small subset of known historical anomalies
        n_anom = 40
        area_a = rng.uniform(5.0, 50.0, size=n_anom)
        estimated_a = area_a * rng.uniform(7.0, 12.0, size=n_anom)
        reported_a = estimated_a * rng.uniform(1.8, 3.5, size=n_anom) # massive over-reporting
        diff_ratio_a = (reported_a - estimated_a) / estimated_a
        veg_change_a = rng.normal(-5.0, 8.0, size=n_anom) # degraded or sluggish

        anom_features = np.column_stack([area_a, reported_a, estimated_a, diff_ratio_a, veg_change_a])

        X_train = np.vstack([normal_features, anom_features])
        self.model.fit(X_train)

    def verify_claim(
        self,
        project_id: str,
        reported_tco2e: float,
        estimated_tco2e: float,
        project_area_hectares: float,
        vegetation_change_pct: float = 0.0
    ) -> Dict[str, Any]:
        """
        Evaluates submitted claim against ML estimate and biophysical constraints.
        Returns:
            verification_score: float (0.0 to 1.0)
            anomaly_score: float (0.0 to 1.0)
            risk_level: RiskLevel (LOW, MEDIUM, HIGH)
            is_anomaly: bool
            reasons: List[str]
        """
        reasons: List[str] = []

        if estimated_tco2e <= 0:
            diff_ratio = 1.0
        else:
            diff_ratio = (reported_tco2e - estimated_tco2e) / estimated_tco2e

        claim_density = reported_tco2e / max(project_area_hectares, 0.1)

        # Feature vector
        feature_vec = np.array([[
            project_area_hectares,
            reported_tco2e,
            estimated_tco2e,
            diff_ratio,
            vegetation_change_pct
        ]])

        # Isolation Forest score: lower (more negative) means more anomalous
        raw_score = self.model.score_samples(feature_vec)[0]
        # In scikit-learn, normal points typically have score_samples around -0.38 to -0.42
        # Anomalies have score_samples below -0.55
        raw_offset = -raw_score - 0.40
        normalized_anomaly = float(np.clip(raw_offset * 3.0, 0.05, 0.98))

        # Domain Heuristic Rule Engine
        if diff_ratio > 1.0:  # Reported more than double the ML estimate
            reasons.append(f"Reported carbon exceeds ML estimate by {round(diff_ratio * 100, 1)}%")
            normalized_anomaly = max(normalized_anomaly, 0.88)
        elif diff_ratio > 0.25:
            reasons.append(f"Reported carbon is significantly above ML estimate (+{round(diff_ratio * 100, 1)}%)")
            normalized_anomaly = max(normalized_anomaly, 0.55)

        if claim_density > 25.0:
            reasons.append(f"Claim density ({round(claim_density, 1)} tCO2e/ha) exceeds empirical biophysical maximum")
            normalized_anomaly = max(normalized_anomaly, 0.85)

        if vegetation_change_pct < -5.0 and reported_tco2e > 0:
            reasons.append("Project area shows negative canopy vegetation change (-5% or worse) while claiming positive carbon")
            normalized_anomaly = max(normalized_anomaly, 0.90)

        # For legitimate claims with no flags and within 10% tolerance, anchor anomaly to low risk
        if abs(diff_ratio) <= 0.10 and len(reasons) == 0:
            normalized_anomaly = min(normalized_anomaly, 0.09)

        # Verification score is inverse of anomaly risk
        verification_score = float(np.clip(1.0 - normalized_anomaly, 0.05, 0.98))

        # Determine categorical Risk Level
        if normalized_anomaly >= 0.65 or len(reasons) >= 2:
            risk_level = RiskLevel.HIGH
            is_anomaly = True
        elif normalized_anomaly >= 0.35 or len(reasons) == 1:
            risk_level = RiskLevel.MEDIUM
            is_anomaly = False
        else:
            risk_level = RiskLevel.LOW
            is_anomaly = False

        return {
            "project_id": project_id,
            "verification_score": round(verification_score, 2),
            "anomaly_score": round(normalized_anomaly, 2),
            "risk_level": risk_level.value,
            "is_anomaly": is_anomaly,
            "reasons": reasons,
            "metrics": {
                "difference_ratio_pct": round(diff_ratio * 100, 2),
                "claim_density_t_ha": round(claim_density, 2),
                "vegetation_change_pct": round(vegetation_change_pct, 2)
            }
        }
