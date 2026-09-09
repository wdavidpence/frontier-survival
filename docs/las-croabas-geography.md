# Las Croabas / Puerto Rico geography note

Authored approximation for Frontier Survival. Not survey-grade GIS.

## Sources

- OpenStreetMap/Nominatim: Las Croabas, Cabezas, Fajardo, Puerto Rico — 18.3650 N, 65.6260 W
- Seven Seas Beach (Balneario Seven Seas) — 18.3695 N, 65.6348 W
- Laguna Grande — 18.3767 N, 65.6237 W
- Faro de Las Cabezas de San Juan — 18.3815 N, 65.6181 W
- Cayo Icacos — 18.3867 N, 65.5877 W
- Isla Palominos — 18.3482 N, 65.5676 W
- Culebra municipality bbox — 18.277–18.371 N, 65.393–65.221 W
- Vieques island bbox — 18.080–18.163 N, 65.578–65.267 W
- Puerto Rico main island — about 177 km E–W by 65 km N–S, peak Cerro de Punta 1,338 m

## Game scale

- Las Croabas beach keeps the existing 1:10 walking shelf so spawn, village pad, and sea cave stay playable.
- Puerto Rico, El Yunque, Culebra, and Vieques are compressed into the streamed envelope.
- Named cays are Icacos and Palomino only. Random sparse islets are suppressed.

## Arrival

Fresh worlds start on the Las Croabas sand shelf and look along the beach toward open water, with the Puerto Rico landmass inland and the Spanish Virgins as voyage targets.

## Scale

- Las Croabas beach: **10 m per cell** (1:10). The walking shelf, village pad, and sea cave stay at this scale.
- Fajardo municipality hinterland: **about 70 m per cell**. Real land is ~8.7 km E–W by ~13.3 km N–S (Census ~29.9 sq mi). That will not fit at 10 m/cell (it would be ~870 × 1330 cells). The authored `fajardo-municipio` ellipse maps the municipio south/west of Cabezas into the streamed envelope without flooding Las Croabas Bay.
- Vertical: compressed into the 48-block world. Peaks are silhouettes, not 500 m Sierra de Luquillo ridges.
- Culebra / Vieques / rest of Puerto Rico remain voyage-scale compressions, not survey-true.

## Fajardo municipio mapping

Authored land covers Cabezas (spawn), Fajardo Pueblo, Sardinera, Demajagua, and Río Arriba as named place cues. The Atlantic north of Las Croabas stays water. This is an authored approximation of the municipal land, not GIS.
