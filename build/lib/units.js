"use strict";
// ./lib/units.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitMapImperial = exports.unitMapMetric = void 0;
exports.unitMapMetric = {
    'temperature': '°C', 'humidity': '%', 'precipitation': '%', 'rain': 'mm',
    'wind_speed': 'km/h', 'wind_gusts': 'km/h', 'pm': 'µg/m³', 'cloud': '%',
    'wind_direction': '°', 'dew_point': '°C', 'pressure': 'hPa', 'sunshine': 'h',
    'snowfall': 'cm', 'snow_depth': 'cm'
};
exports.unitMapImperial = {
    'temperature': '°F', 'humidity': '%', 'precipitation': '%', 'rain': 'inch',
    'wind_speed': 'mph', 'wind_gusts': 'mph', 'pm': 'µg/m³', 'cloud': '%',
    'wind_direction': '°', 'dew_point': '°F', 'pressure': 'inHg', 'sunshine': 'h',
    'snowfall': 'inch', 'snow_depth': 'inch'
};
