# Pla curt de migració a postMessage

## Objectiu

Permetre el cas real de producte:

- editor local
- web remota del client
- un únic `preview-module.js` injectat a la web

Sense backend nou i sense exigir mateix origen.

## Pla de treball

### 1. Obrir la preview des de l'editor

- l'editor ha d'obrir la web amb `window.open(...)`
- la URL ha d'incloure `?session=...`
- això s'ha de fer des d'una acció directa d'usuari per evitar bloqueig de pop-ups

### 2. Substituir el transport per `window.postMessage` ✅

- mantenir el shape actual dels missatges
- el transport principal ja és `window.postMessage`
- validar `sessionId` i `origin`
- mantenir lògica de protocol, no redissenyar-la

### 3. Adaptar el `preview-module.js` ✅

- escoltar missatges des de `window.opener`
- tornar `hello`, `preview:info:response`, `config:request` i la resta de missatges actuals
- mantenir tota la lògica actual de discovery, highlight i aplicació d'estils

### 4. Tancar la migració amb proves reals

- tests browser-level del nou handshake entre finestres
- prova manual amb editor local + web remota/staging
- documentar el nou flux com a opció principal d'integració

## Regles de migració

- no tocar `ProjectFile`
- no tocar `config`
- no tocar el protocol funcional més enllà del transport
- no introduir heurístiques noves de negoci
- la migració a `postMessage` ja és la via principal
- cal revisar i retirar les referències antigues a `BroadcastChannel` de la documentació i proves restants
