# Live CSS Visual Editor

Editor visual d'estils CSS segur i desacoblat que es comunica amb una preview via `window.postMessage` entre finestres.

## Desenvolupament local

Prerequisit: Node.js.

1. Instal.la dependencies:
   `npm install`
2. Arrenca l'editor en mode dev:
   `npm run dev`
3. Obre l'editor a `http://127.0.0.1:3000/`

## Prova local editor + preview

Flux recomanat actual:

1. arrenca l'editor amb `npm run dev`
2. obre `http://127.0.0.1:3000/`
3. escriu la URL de la web o carrega un projecte existent
4. l'editor obre la preview automàticament en una finestra nova i hi afegeix la sessió necessària

També pots restaurar una sessió guardada automàticament si hi ha draft disponible.

## Scripts

- `npm run dev` - arrenca Vite
- `npm run build` - genera el build de produccio
- `npm run lint` - valida TypeScript
- `npm run test:e2e` - executa la prova Playwright del handshake real editor + preview
