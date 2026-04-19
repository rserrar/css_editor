# Futures millores

Aquest document recull només allò que continua pendent després de la base ja implementada.

## Ja resolt a dia d'avui

- handshake editor ↔ preview
- `preview:info:response`
- `style:update`
- `style:remove`
- `highlight`
- diagnòstic de compatibilitat
- import/export versionat de `ProjectFile`
- draft amb `localStorage`
- property schema i validacions específiques
- UI guiada per propietats principals
- tests unitaris de domini
- tests browser-level del preview-module

## Curt termini

- polir textos i jerarquia visual dels warnings de l'editor
- decidir el paper final del botó `pushPreview`
- documentació final consolidada sense duplicats
- migració del transport a `window.postMessage` per suportar editor local + web remota

## Preparat però no implementat encara

- suport per més estats semàntics més enllà de `selected` i `open`
- UX més rica per explicar mappings semàntics dins de l'editor

## Mig termini

- undo / redo
- presets o estils predefinits
- agrupació de targets per vista o component
- exportació CSS derivada del `config`
- selecció des de preview cap a l'editor

## Llarg termini

- editor remot
- col·laboració en temps real
- historial de versions
- múltiples drafts o snapshots per projecte

## Possibles millores tècniques

- suport més ric per CSS variables
- millor traçabilitat d'errors i logs de runtime
- cobertura de tests UI de formularis
- consolidació de docs i numeració de `/docs`
