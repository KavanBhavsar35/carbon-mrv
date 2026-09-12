from typing import Dict, Any
from ml.carbon_estimator.parameters import BiophysicalParameters

class CarbonMethodology:
    """
    Computes carbon stock and sequestration according to scientific IPCC Tier-2 accounting formulas.
    Total tCO2e = Area * ( (AGB + BGB) * Carbon_Fraction + SOC_annual_rate ) * (44/12)
    """
    def __init__(self, params: BiophysicalParameters):
        self.params = params

    def calculate_carbon(
        self,
        area_hectares: float,
        vegetation_density_factor: float = 1.0,
        age_years: float = 1.0
    ) -> Dict[str, Any]:
        """
        Calculates estimated carbon sequestration for given area and canopy density.
        """
        if area_hectares <= 0:
            raise ValueError("Project area in hectares must be positive")

        p = self.params

        # Biomass accumulation per hectare (t dry matter / ha)
        total_biomass_per_ha = (p.above_ground_biomass_t_per_ha + p.below_ground_biomass_t_per_ha)
        # Annual incremental sequestered biomass
        annual_biomass_gain_per_ha = total_biomass_per_ha * p.annual_growth_rate * vegetation_density_factor

        # Carbon in biomass (tC/ha)
        biomass_carbon_gain_per_ha = annual_biomass_gain_per_ha * p.carbon_fraction

        # Soil organic carbon accumulation (mangroves bury high SOC per year in sediment)
        annual_soc_burial_tc_per_ha = (p.soil_organic_carbon_tc_per_ha * 0.015) * vegetation_density_factor

        total_annual_tc_per_ha = biomass_carbon_gain_per_ha + annual_soc_burial_tc_per_ha

        # Convert C to CO2e: stoichiometric ratio 44 / 12 = 3.6667
        annual_tco2e_per_ha = total_annual_tc_per_ha * p.co2_stoichiometric_factor

        # Total estimated carbon over period
        estimated_tco2e = area_hectares * annual_tco2e_per_ha * age_years

        return {
            "estimated_tco2e": round(estimated_tco2e, 2),
            "tco2e_per_hectare": round(annual_tco2e_per_ha, 3),
            "biomass_gain_t_per_ha": round(annual_biomass_gain_per_ha, 3),
            "soc_burial_tc_per_ha": round(annual_soc_burial_tc_per_ha, 3),
            "area_hectares": area_hectares,
            "methodology_name": p.name,
            "project_type": p.project_type.value
        }
