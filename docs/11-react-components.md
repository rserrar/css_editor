# Components React

## Objectiu

Mantenir una UI neta on els components treballin amb dades ja preparades i no coneguin el protocol profund.

## Estructura actual simplificada

```txt
App
 ├── StartScreen
 ├── EditorPage
 │    ├── Sidebar de targets
 │    ├── Diagnostics de compatibilitat
 │    └── StylePanel
 │         └── StyleValueField
```

## Components clau actuals

### `StartScreen`

- crea un projecte nou
- importa un fitxer JSON
- ofereix restaurar o descartar draft si n'hi ha un disponible

### `EditorPage`

- mostra l'estat de connexió amb la preview
- mostra diagnostics de compatibilitat i targets
- permet seleccionar el target actiu
- exposa l'acció d'exportar projecte

### `StylePanel`

- recorre les propietats permeses
- mostra cada propietat amb el seu control d'edició
- delega el valor concret a `StyleValueField`

### `StyleValueField`

- resol el tipus de control a partir del property schema
- mostra inputs guiats (`color`, `select`, `size`, `spacing`, `text`)
- permet activar/desactivar una propietat
- permet reset a últim valor conegut o valor per defecte
- manté warnings suaus per valors legacy no compatibles

## Regles per als components

Els components han de:

- mostrar dades ja preparades
- emetre intencions d'usuari
- treballar sobre esquemes i validacions del domini

Els components no han de:

- construir missatges del protocol
- parsejar fitxers exportables
- accedir directament a `window.postMessage`
- decidir compatibilitats de projecte

## Regla principal

La UI pot ser rica en formularis, però la lògica de negoci ha de continuar fora de React tant com sigui possible.
