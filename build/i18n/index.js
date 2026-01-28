"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var i18n_exports = {};
__export(i18n_exports, {
  getI18nName: () => getI18nName,
  translations: () => translations
});
module.exports = __toCommonJS(i18n_exports);
var import_de = require("./de");
var import_en = require("./en");
var import_pl = require("./pl");
var import_ru = require("./ru");
var import_it = require("./it");
var import_es = require("./es");
var import_zh_cn = require("./zh-cn");
var import_fr = require("./fr");
var import_pt = require("./pt");
var import_nl = require("./nl");
var import_uk = require("./uk");
const translations = {
  de: import_de.de,
  en: import_en.en,
  pl: import_pl.pl,
  ru: import_ru.ru,
  it: import_it.it,
  es: import_es.es,
  "zh-cn": import_zh_cn.zh,
  fr: import_fr.fr,
  pt: import_pt.pt,
  nl: import_nl.nl,
  uk: import_uk.uk
};
function getI18nName(key, lang = "en") {
  var _a, _b;
  return ((_a = translations[lang]) == null ? void 0 : _a[key]) || ((_b = translations.en) == null ? void 0 : _b[key]) || key;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getI18nName,
  translations
});
//# sourceMappingURL=index.js.map
