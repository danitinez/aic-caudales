from dataclasses import dataclass, field
from datetime import date
from typing import Dict, List, Optional


@dataclass
class HalfDay:
    icon_code: Optional[int] = None
    estado: str = ""
    temperature: Optional[int] = None
    wind: Optional[int] = None
    gusts: Optional[int] = None
    direction: str = ""
    pressure: Optional[int] = None


@dataclass
class DayForecast:
    date: date
    day: HalfDay
    night: HalfDay


@dataclass
class CityWeather:
    city_id: str
    city_name: str
    days: List[DayForecast] = field(default_factory=list)


@dataclass
class Weather:
    version: str
    last_update: date
    section_cities: Dict[str, str] = field(default_factory=dict)
    cities: List[CityWeather] = field(default_factory=list)
