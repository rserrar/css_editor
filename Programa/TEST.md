
# Guia de Proves en Local

Guia curta per comprovar ràpidament que l'editor i la preview es connecten i que els canvis s'apliquen.

## Què valida aquest document

- connexió editor + preview
- discovery de targets `scope/target`
- aplicació de canvis CSS en runtime
- contracte actual de markup amb `data-editable-scope` i `data-editable`
- estats semàntics com `selected` i `open`
- lectura de valors computats de referència per target

## Comprovació ràpida

### Opció 1: prova automàtica

1. Executa `npm install`
2. Executa `npm run test:e2e`
3. Si passa, el flux mínim queda validat:
   - editor i preview comparteixen origen
   - handshake correcte
   - targets detectats amb key canònica `scope/target`
   - canvi d'estil aplicat en viu

### Opció 2: prova manual en 1 minut

1. Executa `npm run dev`
2. Obre `http://127.0.0.1:3000/`
3. A l'editor, escriu `http://127.0.0.1:3000/example-web.html` i prem `Començar Edició`
4. L'editor ha d'obrir automàticament la preview en una finestra nova
5. Comprova que:
   - surt l'estat `Preview Connectada`
   - apareixen targets com `home.hero/home.title` i `home.subscription/form.label`
6. Selecciona `home.hero/home.title` i canvia `color` a `#ff0000`
7. Verifica que el títol de la preview es torna vermell
8. Verifica que al panell veus `Base: ...` i un indicador (`igual`, `sobreescrit` o `base activa`)

## Requisit crític: obertura des de l'editor

El flux principal actual es basa en `window.postMessage` entre finestres.

- l'editor ha d'obrir la preview o mantenir-ne la referència
- la preview rep automàticament el `sessionId` correcte a la URL quan l'editor l'obre
- el mateix origen ja no és un requisit funcional estricte del transport

## Configuració en Laragon / XAMPP / Wamp

### Pas 1: Preparar la carpeta del projecte

Ves a la teva carpeta arrel del servidor, per exemple `C:\laragon\www` o `C:\xampp\htdocs`, i crea una carpeta anomenada `css-editor-test`.

### Pas 2: Copiar els fitxers de preview

Dins de `css-editor-test`, copia els fitxers següents:

- `preview-module.js`
- `example-web.html`

### Pas 3: Preparar l'editor

Tens dues opcions.

#### Opció A: utilitzar el build

1. Executa `npm run build` a la carpeta de l'editor React
2. Copia el contingut de la carpeta `dist` a `C:\laragon\www\css-editor-test\editor`

#### Opció B: servir-ho tot des de Vite

Aquest projecte ja deixa `example-web.html` i `preview-module.js` dins de `public`, de manera que es poden servir directament des del mateix port de Vite, normalment `http://localhost:3000`.

Passos recomanats:

1. Executa `npm run dev`
2. Obre `http://127.0.0.1:3000/`
3. Escriu `http://127.0.0.1:3000/example-web.html` i prem `Començar Edició`

També pots validar aquest flux automàticament amb `npm run test:e2e`.

## Flux de prova pas a pas

1. **Obre la web de preview**
   La web de preview ja no s'ha d'obrir manualment si vols seguir el flux principal.

2. **Obre l'editor**
   Navega a `http://localhost/css-editor-test/editor/` o a la URL local de l'editor.

3. **Inicia la connexió**
   Escriu la URL de la web de preview dins l'editor i prem `Començar Edició`.
   L'editor obrirà la finestra de preview amb la sessió correcta.

4. **Verificació del handshake**
   - a l'editor, hauries de veure el badge verd: `PREVIEW CONNECTADA`
   - a la llista de targets haurien d'aparèixer elements com `home.hero/home.title`, `layout.mainMenu/menu.option`, etc.

5. **Proves d'edició**
    - selecciona `home.hero/home.title`; hauries de veure un contorn blau a la web de preview
    - canvia el `color` a `#ff0000` o el `fontSize` a `60px`; hauries de veure el canvi instantani a l'altra finestra

6. **Proves de referències de base**
   - amb un target seleccionat, comprova que apareix el bloc de valors detectats al navegador
   - comprova que es mostren per grups i que els grups desplegats tenen les seves referències visibles
   - activa/desactiva una propietat i verifica el badge:
     - `base activa` quan la propietat no està activada
     - `igual` quan el valor editat coincideix amb la base
     - `sobreescrit` quan l'edició difereix de la base

7. **Persistència de plegables**
   - obre un grup com `Espaiat`
   - canvia de target
   - verifica que el grup continua obert (recorda estat entre targets)

## Solució de problemes

- **No es connecten**: obre la consola del navegador a les dues finestres i verifica que el `sessionId` coincideixi i que no hi hagi errors de seguretat
- **La finestra no s'obre**: revisa si el navegador ha bloquejat el pop-up; l'obertura ha de venir d'un clic directe de l'usuari
- **Propietats no s'apliquen**: recorda que l'editor bloqueja caràcters perillosos com `;`; escriu només el valor, per exemple `red` i no `red;`
- **Netejar estils**: per provar l'eliminació, passa el ratolí per sobre d'una propietat editada a l'editor i prem la `X`
- **No surten valors base**: comprova que la preview està connectada i que el target existeix realment al DOM amb `data-editable-scope` + `data-editable`

## Contracte de markup i config

- cada element editable ha de tenir `data-editable-scope` i `data-editable`
- la key canònica sempre és `scope/target`
- la config sempre és stateful, amb forma `{ default, hover, focus, active, disabled, selected, open }`
- fins i tot si només hi ha estils base, s'han de guardar sota `default`
- el `scope` s'ha de posar al mateix node editable; la preview actual no l'hereta del pare
- `selected` depèn de `aria-selected="true"` o `aria-current="page"`
- `open` depèn de `data-state="open"` o `aria-expanded="true"`

## Fitxers de referència

- `programa/public/example-web.html` - markup de mostra alineat amb el contracte actual
- `programa/public/preview-module.js` - implementació real de discovery i selectors
- `programa/src/presentation/components/StylePanel.tsx` - agrupació visual i resum de valors detectats
- `programa/src/presentation/components/StyleValueField.tsx` - indicador `igual/sobreescrit/base activa`
- `programa/.agents/skills/prepare-editable-html/SKILL.md` - guia per etiquetar webs noves
- `programa/.agents/skills/apply-exported-json-to-css/SKILL.md` - guia per portar l'export JSON a CSS persistent

## Recuperar una sessió anterior

- si hi ha un draft guardat, la pantalla inicial permet restaurar-lo
- en restaurar-lo, l'editor recupera el projecte i les dades persistides
- si el projecte tenia `baseUrl`, pots tornar a obrir la preview des d'aquella mateixa URL

## Llista curta de verificació

- `npm run test:unit` passa
- `npm run test:e2e` passa
- `npm run dev` arrenca sense errors
- l'editor mostra `Preview Connectada`
- la sidebar mostra targets reals
- un canvi de `color` o `fontSize` es veu a la preview
- apareixen valors `Base` i badges de comparació als camps d'estil
