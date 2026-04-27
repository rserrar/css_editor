# Live CSS Visual Editor

Editor visual d'estils CSS segur i desacoblat que es comunica amb una preview via `window.postMessage` entre finestres.

## Contracte actual

- cada element editable ha de tenir `data-editable-scope` i `data-editable` al mateix node del DOM
- la key canònica sempre és `scope/target`
- la config sempre és stateful i guarda com a mínim `default` per target

Exemple:

```json
{
  "layout.mainMenu/menu.option": {
    "default": {
      "color": "#222222"
    },
    "hover": {
      "color": "#0055ff"
    }
  }
}
```

## Com funciona el flux

1. la web original es prepara amb `data-editable-scope` i `data-editable`
2. la preview escaneja el DOM i detecta keys canòniques `scope/target`
3. l'editor crea o carrega un `ProjectFile` amb `config` stateful
4. durant l'edició, la preview genera CSS runtime a partir del `config`
5. en exportar, el projecte es desa com JSON i es pot convertir en CSS persistent per integrar-lo a la web real

## Contracte de preview i markup

- la preview llegeix `data-editable-scope` i `data-editable` del mateix node
- no hi ha herència de `scope` des d'un contenidor pare
- la key canònica ha de tenir exactament forma `scope/target`
- `scope` i `target` no poden ser buits ni contenir `/`
- si falta `data-editable-scope`, el node s'ignora

## Estats suportats

Els estats runtime reals suportats per l'aplicació són:

- `default`
- `hover`
- `focus`
- `active`
- `disabled`
- `selected`
- `open`

Signals semàntics suportats actualment:

- `selected` -> `aria-selected="true"` i `aria-current="page"`
- `open` -> `data-state="open"` i `aria-expanded="true"`

## JSON exportat

El fitxer exportat és un `ProjectFile` amb aquesta estructura general:

```json
{
  "schemaVersion": 2,
  "project": {},
  "sourcePreview": {},
  "config": {
    "scope/target": {
      "default": {},
      "hover": {}
    }
  }
}
```

Notes importants:

- `schemaVersion` actual suportat: `2`
- `config` només accepta valors stateful
- `default` és obligatori a cada target
- les propietats CSS del `config` es guarden en camelCase i la preview les converteix a kebab-case quan genera CSS

## Skills disponibles

Aquest repo inclou dos manuals reutilitzables a `.agents/skills`:

- `programa/.agents/skills/prepare-editable-html/SKILL.md` - com etiquetar una web per fer-la editable
- `programa/.agents/skills/apply-exported-json-to-css/SKILL.md` - com convertir el JSON exportat en CSS integrable

Si has de preparar una web nova o integrar un export a un projecte real, aquests dos fitxers són la referència principal.

## Desenvolupament local

Prerequisit: Node.js.

1. instal.la dependencies: `npm install`
2. arrenca l'editor en mode dev: `npm run dev`
3. obre l'editor a `http://127.0.0.1:3000/`

## Prova local editor + preview

Flux recomanat actual:

1. arrenca l'editor amb `npm run dev`
2. obre `http://127.0.0.1:3000/`
3. escriu la URL de la web o carrega un projecte existent
4. l'editor obre la preview automàticament en una finestra nova i hi afegeix la sessió necessària

També pots restaurar una sessió guardada automàticament si hi ha draft disponible.

## Scripts

- `npm run dev` - arrenca Vite
- `npm run build` - genera el build de producció
- `npm run lint` - valida TypeScript
- `npm run test:unit` - executa els tests unitaris principals
- `npm run test:e2e` - executa la prova Playwright del handshake real editor + preview
- `npm run test:e2e:headed` - executa l'E2E amb navegador visible
