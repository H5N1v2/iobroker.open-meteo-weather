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
class OpenMeteoWeather extends utils.Adapter {
    constructor(options = {}) {
        super({ ...options, name: 'open-meteo-weather' });
        this.updateInterval = undefined;
        this.systemLang = 'de';
        this.systemTimeZone = 'Europe/Berlin';
        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }
    getTranslation(key) {
        if (!i18n_1.translations)
            return key;
        return i18n_1.translations[this.systemLang]?.[key] || i18n_1.translations['en']?.[key] || key;
    }
    async onReady() {
        try {
            const sysConfig = await this.getForeignObjectAsync('system.config');
            if (sysConfig && sysConfig.common) {
                this.systemLang = sysConfig.common.language || 'de';
                this.systemTimeZone = sysConfig.common.timezone || 'Europe/Berlin';
            }
        }
        catch (e) {
            this.log.error('Systemeinstellungen konnten nicht geladen werden.');
        }
        this.log.info(`Adapter gestartet. Sprache: ${this.systemLang}, Zeitzone: ${this.systemTimeZone}`);
        await this.updateData();
        const config = this.config;
        const intervalMs = (parseInt(config.interval) || 30) * 60000;
        this.updateInterval = this.setInterval(() => this.updateData(), intervalMs);
    }
    async updateData() {
        try {
            const config = this.config;
            const lat = config.latitude;
            const lon = config.longitude;
            // Wir nehmen den Wert direkt. Nur wenn er gar nicht existiert, nehmen wir 7 als Notlösung.
            const fDays = config.forecastDays || 7;
            if (!lat || !lon) {
                this.log.warn('Konfiguration unvollständig (Latitude/Longitude fehlen).');
                return;
            }
            const tz = encodeURIComponent(this.systemTimeZone);
            // Die URL bekommt jetzt exakt das, was du im Admin eingibst (z.B. 14 oder 16)
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunshine_duration,sunset,uv_index_max,rain_sum,snowfall_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,wind_gusts_10m_max,dew_point_2m_mean&timezone=${tz}&forecast_days=${fDays}`;
            // Air Quality begrenzen wir trotzdem auf max 7, da die API dort oft nicht mehr liefert
            const airQualityFDays = fDays > 7 ? 7 : fDays;
            const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen&timezone=${tz}&forecast_days=${airQualityFDays}`;
            this.log.debug(`Rufe Daten ab für ${fDays} Tage.`);
            const resW = await axios_1.default.get(weatherUrl);
            const resA = await axios_1.default.get(airQualityUrl);
            if (resW.data)
                await this.processWeatherData(resW.data);
            if (resA.data)
                await this.processAirQualityData(resA.data);
            this.log.debug('Daten erfolgreich aktualisiert.');
        }
        catch (error) {
            this.log.error(`Abruf fehlgeschlagen: ${error.message}`);
            if (error.response) {
                this.log.error(`API Antwort: ${JSON.stringify(error.response.data)}`);
            }
        }
    }
    async processWeatherData(data) {
        const t = words_1.weatherTranslations[this.systemLang] || words_1.weatherTranslations['de'];
        if (data.current) {
            const isDay = data.current.is_day;
            for (const key in data.current) {
                await this.extendOrCreateState(`weather.current.${key}`, data.current[key], key);
                if (key === 'weather_code') {
                    const code = data.current[key];
                    await this.createCustomState('weather.current.weather_text', t.codes[code] || '?', 'string', 'text', '');
                    const iconSuffix = isDay === 1 ? '' : 'n';
                    await this.createCustomState('weather.current.icon_url', `/adapter/${this.name}/icons/${code}${iconSuffix}.png`, 'string', 'url', '');
                }
            }
        }
        if (data.daily && data.daily.time) {
            for (let i = 0; i < data.daily.time.length; i++) {
                const dayPath = `weather.forecast.day${i}`;
                for (const key in data.daily) {
                    let val = data.daily[key][i];
                    if (val !== undefined && val !== null) {
                        if (key === 'sunshine_duration')
                            val = Math.round((val / 3600) * 100) / 100;
                        if (key === 'sunrise' || key === 'sunset')
                            val = val.split('T')[1]?.substring(0, 5) || val;
                        await this.extendOrCreateState(`${dayPath}.${key}`, val, key);
                    }
                }
            }
        }
    }
    async processAirQualityData(data) {
        if (data.current) {
            for (const key in data.current) {
                await this.extendOrCreateState(`air.current.${key}`, data.current[key], key);
            }
        }
    }
    async createCustomState(id, val, type, role, unit) {
        const key = id.split('.').pop() || id;
        await this.setObjectNotExistsAsync(id, {
            type: 'state',
            common: { name: this.getTranslation(key), type: type, role: role, read: true, write: false, unit: unit },
            native: {},
        });
        await this.setStateAsync(id, { val, ack: true });
    }
    async extendOrCreateState(id, val, translationKey) {
        const unitMap = {
            'temperature': '°C', 'humidity': '%', 'precipitation': 'mm', 'rain_sum': 'mm',
            'snowfall_sum': 'cm', 'wind_gusts': 'km/h', 'wind_speed': 'km/h',
            'pm10': 'µg/m³', 'pm2_5': 'µg/m³', 'pollen': 'grains/m³', 'uv_index': 'UV',
            'sunshine_duration': 'h', 'cloud_cover': '%', 'dew_point': '°C', 'wind_direction': '°'
        };
        let unit = '';
        for (const k in unitMap) {
            if (id.includes(k)) {
                unit = unitMap[k];
                break;
            }
        }
        const key = translationKey || id.split('.').pop() || id;
        const stateName = this.getTranslation(key);
        await this.setObjectNotExistsAsync(id, {
            type: 'state',
            common: { name: stateName, type: typeof val, role: 'value', read: true, write: false, unit: unit },
            native: {},
        });
        await this.setStateAsync(id, { val, ack: true });
    }
    onUnload(callback) {
        if (this.updateInterval)
            this.clearInterval(this.updateInterval);
        callback();
    }
}
if (require.main !== module) {
    module.exports = (options) => new OpenMeteoWeather(options);
}
else {
    new OpenMeteoWeather();
}
