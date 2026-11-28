const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string';
const isOptionalNumber = value => value == null || Number.isFinite(value);
const isOptionalText = value => value == null || isText(value);
const STATION_FLOW_KINDS = ['daily_mean', 'rating_curve', 'measured'];
const STATION_DETAIL_URL = /^https:\/\/www\.aic\.gob\.ar\/sitio\/estaciones-detalle\?a=\d+&z=\d+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const LAKE_MEASUREMENTS = [
  'crown', 'max_level', 'max_normal', 'current_level', 'min_normal',
  'min_extraordinary', 'inflow', 'total_released', 'turbined',
];

export function isLakesFeed(data) {
  return isText(data?.last_update) && Array.isArray(data.reservoirs) &&
    data.reservoirs.every(lake =>
      isText(lake?.id) && isText(lake.name) &&
      LAKE_MEASUREMENTS.every(field => isOptionalNumber(lake[field]))
    );
}

function isHalfDay(value) {
  return isRecord(value) &&
    isOptionalNumber(value.temperature) && isOptionalNumber(value.wind) &&
    isOptionalNumber(value.gusts) && isOptionalText(value.estado) && isOptionalText(value.direction);
}

export function isWeatherFeed(data) {
  return isRecord(data?.section_cities) && Object.values(data.section_cities).every(isText) &&
    Array.isArray(data.cities) && data.cities.every(city =>
      isText(city?.city_id) && isText(city.city_name) && Array.isArray(city.days) &&
      city.days.every(day => isText(day?.date) && isHalfDay(day.day) && isHalfDay(day.night))
    );
}

export function readStationFlows(data) {
  if (!isRecord(data?.sections)) return {};
  return Object.fromEntries(Object.entries(data.sections).filter(([, reading]) =>
    Number.isFinite(reading?.flow_m3s) && reading.flow_m3s >= 0 &&
    STATION_FLOW_KINDS.includes(reading.kind) && isText(reading.station_name) &&
    isText(reading.detail_url) && STATION_DETAIL_URL.test(reading.detail_url) &&
    isText(reading.source_updated_on) && ISO_DATE.test(reading.source_updated_on) &&
    Number.isFinite(Date.parse(reading.source_updated_on))
  ));
}
