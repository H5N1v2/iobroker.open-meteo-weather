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
Object.defineProperty(exports, "__esModule", { value: true });
const utils = __importStar(require("@iobroker/adapter-core"));
const words_1 = require("./lib/words");
const i18n_1 = require("./i18n");
const api_caller_1 = require("./lib/api_caller");
const units_1 = require("./lib/units");
class OpenMeteoWeather extends utils.Adapter {
    // Initialisiert die Basisklasse des Adapters
    constructor(options = {}) {
        super({ ...options, name: 'open-meteo-weather' });
        this.updateInterval = undefined;
        this.systemLang = 'de';
        this.systemTimeZone = 'Europe/Berlin';
        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }
    // Holt die passende Übersetzung für Objektnamen aus den i18n Dateien
    getTranslation(key) {
        if (!i18n_1.translations)
            return key;
        return i18n_1.translations[this.systemLang]?.[key] || i18n_1.translations['en']?.[key] || key;
    }
    // Wandelt Gradzahlen in Himmelsrichtungen als Text um
    getWindDirection(deg) {
        const t = words_1.weatherTranslations[this.systemLang] || words_1.weatherTranslations['de'];
        const directions = t.dirs || ["N", "NO", "O", "SO", "S", "SW", "W", "NW"];
        const index = Math.round(deg / 45) % 8;
        return directions[index];
    }
    // Liefert den Pfad zum passenden Icon für die Windrichtung
    getWindDirectionIcon(deg) {
        const fileNames = ["n.png", "no.png", "o.png", "so.png", "s.png", "sw.png", "w.png", "nw.png"];
        const index = Math.round(deg / 45) % 8;
        return `/adapter/${this.name}/icons/wind_direction_icons/${fileNames[index]}`;
    }
    // Ermittelt basierend auf der Windgeschwindigkeit das passende Warn-Icon
    getWindGustIcon(gusts) {
        const config = this.config;
        const isImperial = config.isImperial || false;
        const factor = isImperial ? 1.60934 : 1;
        if (gusts < 39 / factor)
            return '';
        if (gusts < 50 / factor)
            return `/adapter/${this.name}/icons/wind_icons/0.png`;
        if (gusts < 62 / factor)
            return `/adapter/${this.name}/icons/wind_icons/1.png`;
        if (gusts < 75 / factor)
            return `/adapter/${this.name}/icons/wind_icons/2.png`;
        if (gusts < 89 / factor)
            return `/adapter/${this.name}/icons/wind_icons/3.png`;
        return `/adapter/${this.name}/icons/wind_icons/4.png`;
    }
    // Errechnet den Taupunkt unter Berücksichtigung der eingestellten Maßeinheit
    calculateDewPoint(temp, humidity) {
        const config = this.config;
        const isImperial = config.isImperial || false;
        let t = isImperial ? (temp - 32) * 5 / 9 : temp;
        const rh = humidity / 100;
        const a = 17.625;
        const b = 243.04;
        const alpha = Math.log(rh) + (a * t) / (b + t);
        let dewPoint = (b * alpha) / (a - alpha);
        if (isImperial) {
            dewPoint = (dewPoint * 9 / 5) + 32;
        }
        return parseFloat(dewPoint.toFixed(1));
    }
    // Setzt die Grundeinstellungen beim Start und startet den Update-Zyklus
    async onReady() {
        try {
            const sysConfig = await this.getForeignObjectAsync('system.config');
            if (sysConfig && sysConfig.common) {
                this.systemLang = sysConfig.common.language || 'de';
                this.systemTimeZone = sysConfig.common.timezone || 'Europe/Berlin';
            }
            await this.cleanupObjects();
        }
        catch (e) {
            this.log.error('Initialisierung fehlgeschlagen.');
        }
        await this.updateData();
        const config = this.config;
        const intervalMs = (parseInt(config.interval) || 30) * 60000;
        this.updateInterval = this.setInterval(() => this.updateData(), intervalMs);
    }
    // Entfernt veraltete oder deaktivierte Datenpunkte aus der Objektstruktur
    async cleanupObjects() {
        const config = this.config;
        try {
            const allObjects = await this.getAdapterObjectsAsync();
            const allIds = Object.keys(allObjects);
            const maxDays = parseInt(config.forecastDays) || 0;
            const maxHoursLimit = parseInt(config.forecastHours) || 0;
            const hoursEnabled = config.forecastHoursEnabled || false;
            for (const id of allIds) {
                const relativeId = id.replace(`${this.namespace}.`, '');
                if (config.airQualityEnabled === false && relativeId.startsWith('air.')) {
                    await this.delObjectAsync(relativeId, { recursive: true });
                    continue;
                }
                if (!hoursEnabled && relativeId.startsWith('weather.forecast.hourly')) {
                    await this.delObjectAsync(relativeId, { recursive: true });
                    continue;
                }
                const dayMatch = relativeId.match(/day(\d+)/);
                if (dayMatch) {
                    const dayIdx = parseInt(dayMatch[1]);
                    if (dayIdx >= maxDays) {
                        const parts = relativeId.split('.');
                        const dayPathIdx = parts.findIndex(p => p.startsWith('day'));
                        const folderToDelete = parts.slice(0, dayPathIdx + 1).join('.');
                        await this.delObjectAsync(folderToDelete, { recursive: true });
                        continue;
                    }
                }
                const hourMatch = relativeId.match(/hour(\d+)/);
                if (hourMatch) {
                    const hourIdx = parseInt(hourMatch[1]);
                    if (hourIdx >= maxHoursLimit) {
                        const parts = relativeId.split('.');
                        const hourPathIdx = parts.findIndex(p => p.startsWith('hour'));
                        const folderToDelete = parts.slice(0, hourPathIdx + 1).join('.');
                        await this.delObjectAsync(folderToDelete, { recursive: true });
                    }
                }
            }
        }
        catch (err) {
            this.log.error(`Cleanup Fehler: ${err.message}`);
        }
    }
    // Steuert den Abruf der Wetterdaten und verteilt sie an die Verarbeitungsfunktionen
    async updateData() {
        try {
            const config = this.config;
            if (!config.latitude || !config.longitude) {
                this.log.warn('Koordinaten fehlen.');
                return;
            }
            const data = await (0, api_caller_1.fetchAllWeatherData)({
                latitude: config.latitude,
                longitude: config.longitude,
                forecastDays: config.forecastDays || 7,
                forecastHours: config.forecastHours || 1,
                forecastHoursEnabled: config.forecastHoursEnabled || false,
                airQualityEnabled: config.airQualityEnabled || false,
                timezone: this.systemTimeZone,
                isImperial: config.isImperial || false
            });
            if (data.weather)
                await this.processWeatherData(data.weather);
            if (data.hourly)
                await this.processForecastHoursData(data.hourly);
            if (data.air)
                await this.processAirQualityData(data.air);
        }
        catch (error) {
            this.log.error(`Abruf fehlgeschlagen: ${error.message}`);
        }
    }
    // Verarbeitet aktuelle Wetterdaten sowie die tägliche Vorhersage
    async processWeatherData(data) {
        const t = words_1.weatherTranslations[this.systemLang] || words_1.weatherTranslations['de'];
        if (data.current) {
            const isDay = data.current.is_day;
            if (typeof data.current.temperature_2m === 'number' && typeof data.current.relative_humidity_2m === 'number') {
                const dp = this.calculateDewPoint(data.current.temperature_2m, data.current.relative_humidity_2m);
                await this.extendOrCreateState(`weather.current.dew_point_2m`, dp, 'dew_point_2m');
            }
            for (const key in data.current) {
                let val = data.current[key];
                if (key === 'time' && typeof val === 'string') {
                    const dateObj = new Date(val);
                    val = dateObj.toLocaleString(this.systemLang, {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: this.systemLang === 'en'
                    });
                }
                await this.extendOrCreateState(`weather.current.${key}`, val, key);
                if (key === 'weather_code') {
                    await this.createCustomState('weather.current.weather_text', t.codes[val] || '?', 'string', 'text', '');
                    await this.createCustomState('weather.current.icon_url', `/adapter/${this.name}/icons/${val}${isDay === 1 ? '' : 'n'}.png`, 'string', 'url', '');
                }
                if (key === 'wind_direction_10m' && typeof val === 'number') {
                    await this.createCustomState('weather.current.wind_direction_text', this.getWindDirection(val), 'string', 'text', '');
                    await this.createCustomState('weather.current.wind_direction_icon', this.getWindDirectionIcon(val), 'string', 'url', '');
                }
                if (key === 'wind_gusts_10m' && typeof val === 'number') {
                    await this.createCustomState('weather.current.wind_gust_icon', this.getWindGustIcon(val), 'string', 'url', '');
                }
            }
        }
        if (data.daily) {
            for (let i = 0; i < (data.daily.time?.length || 0); i++) {
                const dayPath = `weather.forecast.day${i}`;
                for (const key in data.daily) {
                    let val = data.daily[key][i];
                    if (key === 'time' && typeof val === 'string') {
                        const dateObj = new Date(val);
                        val = dateObj.toLocaleDateString(this.systemLang, { day: '2-digit', month: '2-digit', year: 'numeric' });
                    }
                    if (key === 'sunshine_duration' && typeof val === 'number') {
                        val = parseFloat((val / 3600).toFixed(2));
                    }
                    if ((key === 'sunrise' || key === 'sunset') && typeof val === 'string') {
                        const dateObj = new Date(val);
                        val = dateObj.toLocaleTimeString(this.systemLang, {
                            hour: '2-digit', minute: '2-digit', hour12: this.systemLang === 'en'
                        });
                    }
                    await this.extendOrCreateState(`${dayPath}.${key}`, val, key);
                    if (key === 'wind_direction_10m_dominant' && typeof val === 'number') {
                        await this.createCustomState(`${dayPath}.wind_direction_text`, this.getWindDirection(val), 'string', 'text', '');
                        await this.createCustomState(`${dayPath}.wind_direction_icon`, this.getWindDirectionIcon(val), 'string', 'url', '');
                    }
                    if (key === 'wind_gusts_10m_max' && typeof val === 'number') {
                        await this.createCustomState(`${dayPath}.wind_gust_icon`, this.getWindGustIcon(val), 'string', 'url', '');
                    }
                    if (key === 'weather_code') {
                        await this.createCustomState(`${dayPath}.weather_text`, t.codes[val] || '?', 'string', 'text', '');
                        await this.createCustomState(`${dayPath}.icon_url`, `/adapter/${this.name}/icons/${val}.png`, 'string', 'url', '');
                    }
                }
            }
        }
    }
    // Verarbeitet die stündlichen Vorhersagedaten
    async processForecastHoursData(data) {
        const t = words_1.weatherTranslations[this.systemLang] || words_1.weatherTranslations['de'];
        const config = this.config;
        const hoursPerDayLimit = parseInt(config.forecastHours) || 24;
        if (data.hourly && data.hourly.time) {
            for (let i = 0; i < data.hourly.time.length; i++) {
                const dayNum = Math.floor(i / 24);
                const hourInDay = i % 24;
                if (hourInDay < hoursPerDayLimit) {
                    const hourPath = `weather.forecast.hourly.day${dayNum}.hour${hourInDay}`;
                    for (const key in data.hourly) {
                        let val = data.hourly[key][i];
                        if (key === 'time' && typeof val === 'string') {
                            const dateObj = new Date(val);
                            val = dateObj.toLocaleString(this.systemLang, {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', hour12: this.systemLang === 'en'
                            });
                        }
                        if (key === 'sunshine_duration' && typeof val === 'number') {
                            val = parseFloat((val / 3600).toFixed(2));
                        }
                        await this.extendOrCreateState(`${hourPath}.${key}`, val, key);
                        if (key === 'weather_code') {
                            await this.createCustomState(`${hourPath}.weather_text`, t.codes[val] || '?', 'string', 'text', '');
                            await this.createCustomState(`${hourPath}.icon_url`, `/adapter/${this.name}/icons/${val}.png`, 'string', 'url', '');
                        }
                        if (key === 'wind_direction_10m' && typeof val === 'number') {
                            await this.createCustomState(`${hourPath}.wind_direction_text`, this.getWindDirection(val), 'string', 'text', '');
                            await this.createCustomState(`${hourPath}.wind_direction_icon`, this.getWindDirectionIcon(val), 'string', 'url', '');
                        }
                        if (key === 'wind_gusts_10m' && typeof val === 'number') {
                            await this.createCustomState(`${hourPath}.wind_gust_icon`, this.getWindGustIcon(val), 'string', 'url', '');
                        }
                    }
                }
            }
        }
    }
    // Verarbeitet Daten zur Luftqualität und Pollenbelastung
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
    // Erstellt einen neuen Datenpunkt mit benutzerdefinierter Rolle und Einheit
    async createCustomState(id, val, type, role, unit) {
        await this.setObjectNotExistsAsync(id, {
            type: 'state',
            common: { name: this.getTranslation(id.split('.').pop() || id), type, role, read: true, write: false, unit },
            native: {},
        });
        await this.setStateAsync(id, { val, ack: true });
    }
    // Erstellt oder aktualisiert einen Datenpunkt und weist automatisch Einheiten zu
    async extendOrCreateState(id, val, translationKey) {
        const config = this.config;
        let unit = '';
        const currentUnitMap = config.isImperial ? units_1.unitMapImperial : units_1.unitMapMetric;
        for (const k in currentUnitMap) {
            if (id.includes(k)) {
                unit = currentUnitMap[k];
                break;
            }
        }
        await this.setObjectNotExistsAsync(id, {
            type: 'state',
            common: {
                name: this.getTranslation(translationKey || id.split('.').pop() || id),
                type: typeof val,
                role: 'value',
                read: true, write: false, unit
            },
            native: {},
        });
        await this.setStateAsync(id, { val, ack: true });
    }
    // Bereinigt Intervalle beim Beenden des Adapters
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
