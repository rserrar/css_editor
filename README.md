# CSS Editor

Repositori canònic de l'editor visual CSS i la seva documentació.

## Què fa l'aplicació

L'aplicació permet editar estils visuals d'una web real sense tocar-ne l'estructura.

Flux principal actual:

1. obres l'editor local
2. hi escrius la URL de la web o carregues un projecte existent
3. l'editor obre la preview automàticament en una finestra nova
4. l'editor i la preview es comuniquen amb `window.postMessage`
5. pots editar colors, tipografia, espaiat, fons, imatges i diferents estats visuals en viu

El sistema està pensat perquè a la web del client només calgui injectar `preview-module.js`, mentre que l'editor continua sent una aplicació separada.

## Estructura

- `Programa/` - aplicació principal (editor React, preview-module, proves i configuració)
- `docs/` - documentació canònica del sistema

## Flux actual

- l'editor s'executa localment
- la preview s'obre automàticament des de l'editor en una finestra nova
- la comunicació actual entre editor i preview es fa amb `window.postMessage`
- l'editor pot restaurar una sessió o draft anterior si n'hi ha un de disponible

## Punt d'entrada recomanat

- aplicació: `Programa/README.md`
- documentació: `docs/README.md`
