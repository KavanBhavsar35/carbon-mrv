from typing import Dict, Any, Optional
from shared.schemas.models import ProjectType
from ml.carbon_estimator.parameters import DEFAULT_PARAMETERS, BiophysicalParameters
from ml.carbon_estimator.methodology import CarbonMethodology
from ml.carbon_estimator.uncertainty import compute_uncertainty_bounds

class CarbonEstimator:
    """
    Main carbon estimation engine supporting multiple project types and configurable methodologies.
    """
    def __init__(self):
        self.parameter_registry = DEFAULT_PARAMETERS

    def estimate_carbon(
        self,
        area_hectares: float,
        project_type: ProjectType = ProjectType.MANGROVE,
        methodology_name: str = "CONFIGURABLE_MANGROVE_METHOD",
        custom_params: Optional[Dict[str, float]] = None,
        vegetation_density: float = 1.0
    ) -> Dict[str, Any]:
        """
        Estimates carbon sequestration with uncertainty envelope.
        """
        base_params = self.parameter_registry.get(project_type, self.parameter_registry[ProjectType.OTHER])

        # Apply custom parameter overrides if provided
        if custom_params:
            params = BiophysicalParameters(
                project_type=project_type,
                name=methodology_name or base_params.name,
                above_ground_biomass_t_per_ha=custom_params.get("above_ground_biomass", base_params.above_ground_biomass_t_per_ha),
                below_ground_biomass_t_per_ha=custom_params.get("below_ground_biomass", base_params.below_ground_biomass_t_per_ha),
                soil_organic_carbon_tc_per_ha=custom_params.get("soil_organic_carbon", base_params.soil_organic_carbon_tc_per_ha),
                carbon_fraction=custom_params.get("carbon_fraction", base_params.carbon_fraction),
                annual_growth_rate=custom_params.get("annual_growth_rate", base_params.annual_growth_rate),
                uncertainty_sigma=custom_params.get("uncertainty_sigma", base_params.uncertainty_sigma)
            )
        else:
            params = base_params

        methodology = CarbonMethodology(params)
        carbon_calc = methodology.calculate_carbon(
            area_hectares=area_hectares,
            vegetation_density_factor=vegetation_density
        )

        estimated_tco2e = carbon_calc["estimated_tco2e"]
        lower_b, upper_b, confidence = compute_uncertainty_bounds(
            estimated_tco2e=estimated_tco2e,
            sigma_relative=params.uncertainty_sigma
        )

        return {
            "estimated_tco2e": estimated_tco2e,
            "lower_bound_tco2e": lower_b,
            "upper_bound_tco2e": upper_b,
            "confidence": confidence,
            "methodology": methodology_name,
            "breakdown": carbon_calc,
            "parameters_used": {
                "agb_t_ha": params.above_ground_biomass_t_per_ha,
                "bgb_t_ha": params.below_ground_biomass_t_per_ha,
                "soc_tc_ha": params.soil_organic_carbon_tc_per_ha,
                "carbon_fraction": params.carbon_fraction,
                "growth_rate": params.annual_growth_rate
            }
        }
