import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    PROJECT_OWNER = "PROJECT_OWNER"
    VERIFIER = "VERIFIER"
    USER = "USER"

class OrganizationType(str, enum.Enum):
    NGO = "NGO"
    PANCHAYAT = "PANCHAYAT"
    COMMUNITY = "COMMUNITY"
    COMPANY = "COMPANY"

class ProjectType(str, enum.Enum):
    MANGROVE = "MANGROVE"
    SEAGRASS = "SEAGRASS"
    SALT_MARSH = "SALT_MARSH"
    CORAL_REEF = "CORAL_REEF"
    KELP_FOREST = "KELP_FOREST"

class ProjectStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"

class ProjectUserRole(str, enum.Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    CONTRIBUTOR = "CONTRIBUTOR"
    VIEWER = "VIEWER"

class DeviceType(str, enum.Enum):
    SENSOR = "SENSOR"
    CAMERA = "CAMERA"
    WEATHER_STATION = "WEATHER_STATION"

class DeviceStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"
    ERROR = "ERROR"

class MeasurementType(str, enum.Enum):
    TEMPERATURE = "TEMPERATURE"
    PH = "PH"
    SALINITY = "SALINITY"
    TURBIDITY = "TURBIDITY"
    DISSOLVED_OXYGEN = "DISSOLVED_OXYGEN"
    WATER_LEVEL = "WATER_LEVEL"
    BIOMASS = "BIOMASS"

class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class CreditStatus(str, enum.Enum):
    ISSUED = "ISSUED"
    SOLD = "SOLD"
    RETIRED = "RETIRED"

class TransactionType(str, enum.Enum):
    MINT = "MINT"
    TRANSFER = "TRANSFER"
    PURCHASE = "PURCHASE"
    RETIRE = "RETIRE"

class TransactionStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
