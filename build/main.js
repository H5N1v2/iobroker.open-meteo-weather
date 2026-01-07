"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils = __importStar(require("@iobroker/adapter-core"));
const axios_1 = __importDefault(require("axios"));
const words_1 = require("./lib/words");
const i18n_1 = require("./i18n");
// Die Hauptklasse des Adapters – hier wird alles gesteuert
class OpenMeteoWeather extends utils.Adapter {
    constructor(options = {}) {
        super({ ...options, name: 'open-meteo-weather' });
        this.updateInterval = undefined;
        this.systemLang = 'de';
        this.systemTimeZone = 'Europe/Berlin';
        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }
    // Sucht die passende Übersetzung für Objektnamen (z.B. aus deiner i18n/de.json)
    getTranslation(key) {
        if (!i18n_1.translations)
            return key;
        return i18n_1.translations[this.systemLang]?.[key] || i18n_1.translations['en']?.[key] || key;
    }
    // Berechnet aus der Gradzahl (0-360) die Windrichtung als Text (N, NW, etc.)
    getWindDirection(deg) {
        const t = words_1.weatherTranslations[this.systemLang] || words_1.weatherTranslations['de'];
        const directions = t.dirs || ["N", "NO", "O", "SO", "S", "SW", "W", "NW"];
        const index = Math.round(deg / 45) % 8;
        return directions[index];
    }
    // Wird ausgeführt, wenn der Adapter startet: Lädt System-Infos und räumt auf
    async onReady() {
        try {
            const sysConfig = await this.getForeignObjectAsync('system.config');
            if (sysConfig && sysConfig.common) {
                this.systemLang = sysConfig.common.language || 'de';
                this.systemTimeZone = sysConfig.common.timezone || 'Europe/Berlin';
            }
            await this.cleanupObjects(); // Räumt alte Datenpunkte sofort beim Start auf
        }
        catch (e) {
            this.log.error('Initialisierung fehlgeschlagen.');
        }
        await this.updateData(); // Erster Datenabruf
        const config = this.config;
        const intervalMs = (parseInt(config.interval) || 30) * 60000;
        this.updateInterval = this.setInterval(() => this.updateData(), intervalMs);
    }
    // Durchsucht alle Objekte und löscht die, die deaktiviert oder zu viel sind (Tage & Stunden)
    async cleanupObjects() {
        const config = this.config;
        if (config.airQualityEnabled === false) {
            await this.delObjectAsync('air', { recursive: true });
        }
        try {
            const allObjects = await this.getAdapterObjectsAsync();
            const allIds = Object.keys(allObjects);
            const maxDays = parseInt(config.forecastDays) || 0;
            const maxHours = parseInt(config.forecastHours) || 0;
            const hoursEnabled = config.forecastHoursEnabled || false;
            for (const id of allIds) {
                const relativeId = id.replace(`${this.namespace}.`, '');
                // Prüft ob es ein "Tag"-Ordner ist und ob er gelöscht werden muss
                const dayMatch = id.match(/day(\d+)/);
                if (dayMatch && parseInt(dayMatch[1]) >= maxDays) {
                    const folder = relativeId.split('.').slice(0, 3).join('.');
                    await this.delObjectAsync(folder, { recursive: true });
                }
                // Prüft ob es ein "Stunden"-Ordner ist und ob er gelöscht werden muss
                const hourMatch = id.match(/hour(\d+)/);
                if (hourMatch) {
                    if (!hoursEnabled || parseInt(hourMatch[1]) >= maxHours) {
                        const folder = relativeId.split('.').slice(0, 3).join('.');
                        await this.delObjectAsync(folder, { recursive: true });
                    }
                }
            }
        }
        catch (err) {
            this.log.error(`Cleanup Fehler: ${err.message}`);
        }
    }
    // Abruf: Ruft alle aktivierten APIs auf
    async updateData() {
        try {
            const config = this.config;
            const lat = config.latitude;
            const lon = config.longitude;
            const fDays = config.forecastDays || 7;
            const tz = encodeURIComponent(this.systemTimeZone);
            if (!lat || !lon)
                return;
            // 1. Wetter-API (Aktuell & Tage)
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunshine_duration,sunset,uv_index_max,rain_sum,snowfall_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,wind_gusts_10m_max,dew_point_2m_mean&timezone=${tz}&forecast_days=${fDays}`;
            const resW = await axios_1.default.get(weatherUrl);
            if (resW.data)
                await this.processWeatherData(resW.data);
            // 2. Stunden-Vorhersage-API (falls in Einstellungen aktiv)
            if (config.forecastHoursEnabled) {
                const fHours = config.forecastHours || 1;
                const hourlyUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,precipitation_probability,rain,weather_code,surface_pressure,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,soil_temperature_0cm,uv_index,sunshine_duration,is_day,snowfall,snow_depth&timezone=${tz}&forecast_hours=${fHours}`;
                const resH = await axios_1.default.get(hourlyUrl);
                if (resH.data)
                    await this.processForecastHoursData(resH.data);
            }
            // 3. Luftqualitäts-API (falls in Einstellungen aktiv)
            if (config.airQualityEnabled) {
                const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen&timezone=${tz}&forecast_days=${fDays > 7 ? 7 : fDays}`;
                const resA = await axios_1.default.get(airUrl);
                if (resA.data)
                    await this.processAirQualityData(resA.data);
            }
        }
        catch (error) {
            this.log.error(`Abruf fehlgeschlagen: ${error.message}`);
        }
    }
    // Verarbeitet die JSON-Antwort der Wetter-API und erstellt/füllt die Datenpunkte
    async processWeatherData(data) {
        const t = words_1.weatherTranslations[this.systemLang] || words_1.weatherTranslations['de'];
        if (data.current) {
            const isDay = data.current.is_day;
            for (const key in data.current) {
                await this.extendOrCreateState(`weather.current.${key}`, data.current[key], key);
                if (key === 'weather_code') {
                    const code = data.current[key];
                    await this.createCustomState('weather.current.weather_text', t.codes[code] || '?', 'string', 'text', '');
                    await this.createCustomState('weather.current.icon_url', `/adapter/${this.name}/icons/${code}${isDay === 1 ? '' : 'n'}.png`, 'string', 'url', '');
                }
                if (key === 'wind_direction_10m') {
                    await this.createCustomState('weather.current.wind_direction_text', this.getWindDirection(data.current[key]), 'string', 'text', '');
                }
            }
        }
        if (data.daily) {
            for (let i = 0; i < (data.daily.time?.length || 0); i++) {
                const dayPath = `weather.forecast.day${i}`;
                for (const key in data.daily) {
                    const val = data.daily[key][i];
                    await this.extendOrCreateState(`${dayPath}.${key}`, val, key);
                    if (key === 'weather_code') {
                        await this.createCustomState(`${dayPath}.weather_text`, t.codes[val] || '?', 'string', 'text', '');
                        await this.createCustomState(`${dayPath}.icon_url`, `/adapter/${this.name}/icons/${val}.png`, 'string', 'url', '');
                    }
                }
            }
        }
    }
    // Erstellt Ordner hour0, hour1 etc.
    async processForecastHoursData(data) {
        const t = words_1.weatherTranslations[this.systemLang] || words_1.weatherTranslations['de'];
        if (data.hourly) {
            for (const key in data.hourly) {
                const values = data.hourly[key];
                for (let i = 0; i < values.length; i++) {
                    const hourPath = `weather.forecast.hour${i}`;
                    await this.extendOrCreateState(`${hourPath}.${key}`, values[i], key);
                    if (key === 'weather_code') {
                        await this.createCustomState(`${hourPath}.weather_text`, t.codes[values[i]] || '?', 'string', 'text', '');
                        await this.createCustomState(`${hourPath}.icon_url`, `/adapter/${this.name}/icons/${values[i]}.png`, 'string', 'url', '');
                    }
                }
            }
        }
    }
    // Verarbeitet Luftwerte und Pollen – wandelt Pollen-Zahlen in Texte um
    async processAirQualityData(data) {
        const t = words_1.weatherTranslations[this.systemLang] || words_1.weatherTranslations['de'];
        if (data.current) {
            for (const key in data.current) {
                await this.extendOrCreateState(`air.current.${key}`, data.current[key], key);
                if (key.includes('pollen')) {
                    const val = data.current[key];
                    const pollenText = val > 2 ? t.pollen.high : (val > 1 ? t.pollen.moderate : (val > 0 ? t.pollen.low : t.pollen.none));
                    await this.createCustomState(`air.current.${key}_text`, pollenText, 'string', 'text', '');
                }
            }
        }
    }
    // Helfer-Funktion: Erstellt einen Datenpunkt mit festen Eigenschaften (z.B. für Texte)
    async createCustomState(id, val, type, role, unit) {
        await this.setObjectNotExistsAsync(id, {
            type: 'state',
            common: { name: this.getTranslation(id.split('.').pop() || id), type, role, read: true, write: false, unit },
            native: {},
        });
        await this.setStateAsync(id, { val, ack: true });
    }
    // Prüft IDs auf Schlüsselwörter und weist Einheiten (°C, %, hPa) zu
    async extendOrCreateState(id, val, translationKey) {
        const unitMap = {
            'temperature': '°C', 'humidity': '%', 'precipitation': 'mm', 'rain': 'mm',
            'wind_speed': 'km/h', 'wind_gusts': 'km/h', 'pm': 'µg/m³', 'cloud': '%',
            'wind_direction': '°', 'dew_point': '°C', 'pressure': 'hPa', 'sunshine': 's',
            'snow_depth': 'm', 'snowfall': 'cm'
        };
        let unit = '';
        for (const k in unitMap) {
            if (id.includes(k))
                unit = unitMap[k];
        }
        await this.setObjectNotExistsAsync(id, {
            type: 'state',
            common: {
                name: this.getTranslation(translationKey || id.split('.').pop() || id),
                type: typeof val,
                role: id.includes('uv_index') ? 'value.uv' : 'value',
                read: true, write: false, unit
            },
            native: {},
        });
        await this.setStateAsync(id, { val, ack: true });
    }
    // Beendet den Adapter
    onUnload(callback) {
        if (this.updateInterval)
            this.clearInterval(this.updateInterval);
        callback();
    }
}
// Einstiegspunkt für ioBroker
if (require.main !== module) {
    module.exports = (options) => new OpenMeteoWeather(options);
}
else {
    new OpenMeteoWeather();
}
