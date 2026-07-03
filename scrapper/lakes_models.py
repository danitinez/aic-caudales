from dataclasses import dataclass, field
from datetime import date
from typing import List, Optional


@dataclass
class Reservoir:
    id: str
    name: str
    order: int
    # Reference levels (msnm — metres above sea level)
    crown: Optional[float] = None              # Coronamiento
    max_level: Optional[float] = None          # Nivel Máximo
    max_normal: Optional[float] = None         # Nivel Máximo Normal
    current_level: Optional[float] = None      # Nivel Actual
    min_normal: Optional[float] = None         # Nivel Mínimo Normal
    min_extraordinary: Optional[float] = None  # Nivel Mínimo Extraordinario
    # Flows (m³/s)
    inflow: Optional[float] = None             # Caudal Entrante
    spilled: Optional[float] = None            # Caudal Vertido
    turbined: Optional[float] = None           # Caudal Turbinado
    total_released: Optional[float] = None     # Caudal (Total) Erogado
    diverted: Optional[float] = None           # Caudal Derivado (e.g. Portezuelo → Los Barreales)


@dataclass
class Reservoirs:
    version: str
    last_update: date
    reservoirs: List[Reservoir] = field(default_factory=list)
