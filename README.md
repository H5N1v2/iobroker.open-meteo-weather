# ioBroker.open-meteo-weather

[![NPM version](https://img.shields.io/npm/v/iobroker.open-meteo-weather.svg)](https://www.npmjs.com/package/iobroker.open-meteo-weather)
[![Downloads](https://img.shields.io/npm/dm/iobroker.open-meteo-weather.svg)](https://www.npmjs.com/package/iobroker.open-meteo-weather)
![Number of Installations](https://iobroker.live/badges/open-meteo-weather.svg)

**Der Open-Meteo Wetterdienst Adapter für ioBroker.**

Dieser Adapter liefert präzise Wetterdaten, Vorhersagen, Luftqualität und Pollenflug-Informationen von [Open-Meteo.com](https://open-meteo.com/). Die Nutzung ist für den nicht-kommerziellen Gebrauch und weniger als 10.000 tägliche API-Aufrufe ohne Registration für einen API-Key möglich, was die Einrichtung extrem vereinfacht.

---

## Funktionen

* **Aktuelle Wetterdaten:** Echtzeit-Abruf von Temperatur, Feuchtigkeit, Luftdruck und Winddaten.
* **Flexible Vorhersage:** Konfigurierbare Anzahl an Vorhersagetagen und stündlicher Auflösung.
* **Luftqualität & Pollenflug:** Optionale Daten für Feinstaub (PM2.5, PM10) sowie verschiedene Pollenarten (Erle, Birke, Gräser, etc.).
* **Automatisches Cleanup:** Der Adapter bereinigt die Objektstruktur selbstständig, wenn die Vorhersage-Zeiträume in der Konfiguration verkürzt oder geändert werden.
* **Multi-Language:** Unterstützung für 11 Sprachen (u.a. Deutsch, Englisch, Polnisch, Russisch, Französisch, Chinesisch).
* **Einheiten-System:** Nahtloser Wechsel zwischen Metrisch (°C, km/h) und Imperial (°F, mph).

---

## Konfiguration

Nach der Installation müssen folgende Felder in den Instanz-Einstellungen ausgefüllt werden:

1.  **Koordinaten (Breitengrad & Längengrad):** Bestimmen Sie den Ort für die Wetterabfrage auf openstreatmap.org.
2.  **Abfrageintervall:** Zeitabstand in Minuten (Standard: 30 Min).
3.  **Vorhersage-Tage:** Anzahl der Tage für die tägliche Übersicht (0-16 Tage).
4.  **Stündliche Vorhersage:** Aktivierung und Anzahl der Stunden pro Tag (z.B. die nächsten 24 Stunden).
5.  **Optionale Daten:** Checkboxen für Pollenflug und Luftqualität.
6.  **Einheiten:** Auswahl zwischen Metrisch und Imperial.

---

## Icons & Visualisierung

Der Adapter stellt dynamische Pfade zu Icons bereit, die direkt in Visualisierungen (vis, iQontrol, Jarvis) genutzt werden können.

* **Wetter-Icons:** Zu finden unter `weather.current.icon_url`. Der Adapter unterscheidet automatisch zwischen Tag und Nacht (z.B. Sonne vs. Mond).
* **Windrichtung:** Statische Pfade unter `wind_direction_icon` zeigen einen Kompass-Pfeil passend zur Gradzahl.
* **Windböen-Warnung:** Unter `wind_gust_icon` wird ab einer Windgeschwindigkeit von ca. 39 km/h (Bft 6) ein Warn-Icon eingeblendet (Stufen 0-4).

---

## Datenpunkte (Auszug)

| Ordner | Beschreibung |
|:---|:---|
| `weather.current` | Aktuelle Messwerte (Temp, Taupunkt, Wind, etc.) |
| `weather.forecast.dayX` | Tägliche Vorhersage für den Tag X |
| `weather.forecast.hourly.dayX.hourY` | Stündliche Details pro Tag |
| `air.current` | Luftqualität und Pollenbelastung als Text und Wert |

---

## Rechtliches & Copyright

### Icons & Bilder
Die im Adapter enthaltenen Wetter-Icons sowie Windrichtungs-Icons unterliegen dem Urheberrecht des Erstellers. 
* **Nutzung:** Die Icons sind für die Verwendung innerhalb des ioBroakers lizenziert. Eine kommerzielle Weiterverbreitung oder Nutzung außerhalb dieses Adapters bedarf der Zustimmung des Autors h5n1@iknox.de.
* **Wetterdaten:** Alle Wetterdaten werden von [Open-Meteo.com](https://open-meteo.com/) bereitgestellt. Bitte beachten Sie deren Nutzungsbedingungen für kommerzielle Zwecke.

### Lizenz
Dieses Projekt ist unter der **MIT Lizenz** lizenziert - siehe die `LICENSE` Datei für Details.

Copyright (c) 2026 H5N1v2 <h5n1@iknox.de>