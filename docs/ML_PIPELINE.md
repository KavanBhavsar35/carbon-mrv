# ML Pipeline & Carbon Accounting Specification

## 1. Remote Sensing Vegetation & Change Detection
The ML pipeline processes pairs of satellite/drone imagery:
- **Baseline Image ($T_0$)**: Prior to restoration or historical reference period.
- **Current Image ($T_1$)**: Current observation period.

### Processing Steps:
1. **Spectral Normalization**: Load RGB/Multispectral raster or standard imagery, calculate spectral indices such as NDVI ($(\text{NIR} - \text{Red})/(\text{NIR} + \text{Red})$) or Visible Atmospherically Resistant Index (VARI) for standard RGB.
2. **Canopy Segmentation**: Semantic segmentation isolating mangrove/vegetation canopy pixels from water, mudflats, and bare soil.
3. **Area Estimation**:
   $$\text{Area (ha)} = \frac{N_{\text{canopy}} \times (\text{GSD}_x \times \text{GSD}_y)}{10,000}$$
   where $\text{GSD}$ is Ground Sample Distance in meters per pixel.
4. **Temporal Change Detection**:
   $$\Delta \text{Area} = \text{Area}_{T_1} - \text{Area}_{T_0}, \quad \%\text{Change} = \frac{\Delta \text{Area}}{\text{Area}_{T_0}} \times 100$$

## 2. Configurable Carbon Estimation Engine (IPCC Tier-2)
Instead of a hardcoded magic formula, carbon is computed using scientific biophysical formulas:

$$\text{Total Biomass (t/ha)} = \text{AGB} + \text{BGB} + \text{SOC}$$
$$\text{Carbon Stock (tC/ha)} = \text{Total Biomass} \times CF$$
$$\text{Total Potential CO}_2\text{e} = \text{Area (ha)} \times \text{Carbon Stock} \times \left(\frac{44}{12}\right) \times \text{Factor}_{\text{project}}$$

### Configurable Methodologies:
- `CONFIGURABLE_MANGROVE_METHOD`: High soil organic carbon (SOC) multiplier, coastal salinity adjustments.
- `FOREST_REFORESTATION_METHOD`: Terrestrial Above Ground Biomass (AGB) heavy.
- `WETLAND_RESTORATION_METHOD`: Peat and submerged anaerobic soil preservation factors.

### Uncertainty & Confidence Bounds:
Propagation of 95% confidence intervals based on sensor resolution, canopy density variance, and literature parameter standard deviations:
$$\text{Lower Bound} = \text{Estimate} \times (1 - 1.96 \cdot \sigma), \quad \text{Upper Bound} = \text{Estimate} \times (1 + 1.96 \cdot \sigma)$$

## 3. Claim Anomaly & Fraud Detection Engine
An unsupervised **Isolation Forest** coupled with rule-based heuristics to evaluate risk:
- **Feature Vector**:
  $$\vec{x} = \left[ \text{Area}_{\text{project}}, \text{Reported tCO}_2\text{e}, \text{ML Estimated tCO}_2\text{e}, \frac{\text{Reported}}{\text{Estimate}}, \Delta \text{Vegetation}\% \right]$$
- **Verification Score**: Calibrated probability (0.0 to 1.0) of claim plausibility.
- **Risk Levels**:
  - `LOW`: Reported within 10% of estimate, vegetation growth consistent.
  - `MEDIUM`: Reported 10% to 30% above estimate or marginal confidence.
  - `HIGH`: Reported $>30\%$ above estimate or vegetation loss observed while claiming sequestration.
- **Explainability**: Outputs explicit human-readable reasons for auditor review.
