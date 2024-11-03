from dataclasses import dataclass, field
from datetime import date
from typing import List, Optional

@dataclass
class Level:
    type: str
    date: date
    min: Optional[int] = None
    max: Optional[int] = None
    dispensed: Optional[int] = None

@dataclass
class Section:
    name: str = ""
    levels: List[Level] = field(default_factory=list)

@dataclass
class Sections:
    last_update: date
    sections: List[Section] = field(default_factory=list)