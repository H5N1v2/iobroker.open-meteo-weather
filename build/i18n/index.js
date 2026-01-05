"use strict";
// src/lib/i18n/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.translations = void 0;
exports.getI18nName = getI18nName;
const de_1 = require("./de");
const en_1 = require("./en");
const pl_1 = require("./pl");
const ru_1 = require("./ru");
const it_1 = require("./it");
const es_1 = require("./es");
const zh_1 = require("./zh");
const fr_1 = require("./fr");
const pt_1 = require("./pt");
/**
 * Zentrales Übersetzungsobjekt für Datenpunkte
 * Struktur: translations[Sprachcode][DatenpunktKey]
 */
exports.translations = {
    de: de_1.de,
    en: en_1.en,
    pl: pl_1.pl,
    ru: ru_1.ru,
    it: it_1.it,
    es: es_1.es,
    "zh-cn": zh_1.zh,
    fr: fr_1.fr,
    pt: pt_1.pt
};
/**
 * Hilfsfunktion für die Verwendung in der main.ts
 * @param key Der Key aus den Sprachdateien (z.B. 'temperature_2m')
 * @param lang Der aktuelle Sprachcode des ioBroker Systems
 */
function getI18nName(key, lang = 'en') {
    return exports.translations[lang]?.[key] || exports.translations['en']?.[key] || key;
}
