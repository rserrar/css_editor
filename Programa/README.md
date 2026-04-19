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

La preview de mostra ja queda servida des del mateix origen a:

- `http://127.0.0.1:3000/example-web.html?session=PROVA123`
- `http://127.0.0.1:3000/?session=PROVA123`

Aquest flux replica la guia de `TEST.md` i serveix com a prova local del sistema.

## Scripts

- `npm run dev` - arrenca Vite
- `npm run build` - genera el build de produccio
- `npm run lint` - valida TypeScript
- `npm run test:e2e` - executa la prova Playwright del handshake real editor + preview
