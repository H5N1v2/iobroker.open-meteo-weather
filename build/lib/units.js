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
var units_exports = {};
__export(units_exports, {
  unitMapImperial: () => unitMapImperial,
  unitMapMetric: () => unitMapMetric
});
module.exports = __toCommonJS(units_exports);
const unitMapMetric = {
  temperature: "\xB0C",
  humidity: "%",
  precipitation: "%",
  rain: "mm",
  wind_speed: "km/h",
  wind_gusts: "km/h",
  pm: "\xB5g/m\xB3",
  cloud: "%",
  wind_direction: "\xB0",
  dew_point: "\xB0C",
  pressure: "hPa",
  sunshine: "h",
  snowfall: "cm",
  snow_depth: "cm"
};
const unitMapImperial = {
  temperature: "\xB0F",
  humidity: "%",
  precipitation: "%",
  rain: "inch",
  wind_speed: "mph",
  wind_gusts: "mph",
  pm: "\xB5g/m\xB3",
  cloud: "%",
  wind_direction: "\xB0",
  dew_point: "\xB0F",
  pressure: "inHg",
  sunshine: "h",
  snowfall: "inch",
  snow_depth: "inch"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  unitMapImperial,
  unitMapMetric
});
//# sourceMappingURL=units.js.map
