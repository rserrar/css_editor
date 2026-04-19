# CSS Editor

Repositori canònic de l'editor visual CSS i la seva documentació.

## Estructura

- `Programa/` - aplicació principal (editor React, preview-module, proves i configuració)
- `docs/` - documentació canònica del sistema

## Flux actual

- l'editor s'executa localment
- la preview es pot obrir en una finestra remota
- la comunicació actual entre editor i preview es fa amb `window.postMessage`

## Punt d'entrada recomanat

- aplicació: `Programa/README.md`
- documentació: `docs/README.md`
