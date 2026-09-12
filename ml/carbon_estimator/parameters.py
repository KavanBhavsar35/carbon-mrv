from dataclasses import dataclass, field
from typing import Dict
from shared.schemas.models import ProjectType

@dataclass
class BiophysicalParameters:
    project_type: ProjectType
    name: str
    above_ground_biomass_t_per_ha: float # AGB (tonnes dry matter / ha)
    below_ground_biomass_t_per_ha: float # BGB (tonnes dry matter / ha)
    soil_organic_carbon_tc_per_ha: float # SOC (tonnes C / ha in top 1m sediment)
    carbon_fraction: float = 0.47        # IPCC standard biomass carbon fraction
    co2_stoichiometric_factor: float = 44.0 / 12.0 # 3.6667 (tCO2e per tC)
    annual_growth_rate: float = 0.08     # 8% annual increment for restoration age
    uncertainty_sigma: float = 0.07      # 7% relative parameter standard deviation

# Default baseline parameters derived from IPCC Guidelines for National Greenhouse Gas Inventories
# (Wetlands & Forestry supplements)
DEFAULT_PARAMETERS: Dict[ProjectType, BiophysicalParameters] = {
    ProjectType.MANGROVE: BiophysicalParameters(
        project_type=ProjectType.MANGROVE,
        name="IPCC Coastal Blue Carbon — Mangrove Tier 2",
        above_ground_biomass_t_per_ha=40.0,
        below_ground_biomass_t_per_ha=18.0,
        soil_organic_carbon_tc_per_ha=38.93,
        carbon_fraction=0.47,
        annual_growth_rate=0.08,
        uncertainty_sigma=0.068
    ),
    ProjectType.FOREST: BiophysicalParameters(
        project_type=ProjectType.FOREST,
        name="IPCC AFOLU Moist Tropical Reforestation",
        above_ground_biomass_t_per_ha=140.0,
        below_ground_biomass_t_per_ha=35.0,
        soil_organic_carbon_tc_per_ha=70.0,
        carbon_fraction=0.47,
        annual_growth_rate=0.06,
        uncertainty_sigma=0.085
    ),
    ProjectType.WETLAND: BiophysicalParameters(
        project_type=ProjectType.WETLAND,
        name="Inland Peatland & Coastal Marsh Restoration",
        above_ground_biomass_t_per_ha=30.0,
        below_ground_biomass_t_per_ha=25.0,
        soil_organic_carbon_tc_per_ha=180.0,
        carbon_fraction=0.45,
        annual_growth_rate=0.05,
        uncertainty_sigma=0.092
    ),
    ProjectType.AGRICULTURE: BiophysicalParameters(
        project_type=ProjectType.AGRICULTURE,
        name="Regenerative Agroforestry & Soil Carbon",
        above_ground_biomass_t_per_ha=40.0,
        below_ground_biomass_t_per_ha=15.0,
        soil_organic_carbon_tc_per_ha=45.0,
        carbon_fraction=0.45,
        annual_growth_rate=0.04,
        uncertainty_sigma=0.110
    ),
    ProjectType.OTHER: BiophysicalParameters(
        project_type=ProjectType.OTHER,
        name="Nature-Based Generic Conservational Reserve",
        above_ground_biomass_t_per_ha=60.0,
        below_ground_biomass_t_per_ha=20.0,
        soil_organic_carbon_tc_per_ha=60.0,
        carbon_fraction=0.46,
        annual_growth_rate=0.05,
        uncertainty_sigma=0.100
    ),
}
