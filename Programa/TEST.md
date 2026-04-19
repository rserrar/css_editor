
# Guia de Proves en Local

Guia curta per comprovar rapidament que l'editor i la preview es connecten i que els canvis s'apliquen.

## Comprovacio rapida

### Opcio 1: prova automatica

1. Executa `npm install`
2. Executa `npm run test:e2e`
3. Si passa, el flux minim queda validat:
   - editor i preview comparteixen origen
   - handshake correcte
   - targets detectats
   - canvi d'estil aplicat en viu

### Opcio 2: prova manual en 1 minut

1. Executa `npm run dev`
2. Obre `http://127.0.0.1:3000/example-web.html?session=PROVA123`
3. Obre `http://127.0.0.1:3000/?session=PROVA123`
4. A l'editor, escriu la URL de la preview i prem `Començar Edició`
5. Comprova que:
   - surt l'estat `Preview Connectada`
   - apareixen targets com `home.title` i `form.label`
6. Selecciona `home.title` i canvia `color` a `#ff0000`
7. Verifica que el titol de la preview es torna vermell

## Requisit critic: obertura des de l'editor

El flux principal actual es basa en `window.postMessage` entre finestres.

- l'editor ha d'obrir la preview o mantenir-ne la referència
- la preview ha de carregar el `sessionId` correcte a la URL
- el mateix origen ja no és un requisit funcional estricte del transport

## Configuracio en Laragon / XAMPP / Wamp

### Pas 1: Preparar la carpeta del projecte
Ves a la teva carpeta arrel del servidor (ex: `C:\laragon\www` o `C:\xampp\htdocs`) i crea una carpeta anomenada `css-editor-test`.

### Pas 2: Copiar els fitxers de Preview
Dins de `css-editor-test`, copia els fitxers que hem generat:
- `preview-module.js`
- `example-web.html`

### Pas 3: Preparar l'editor
Tens dues opcions:

#### Opció A: Utilitzar el Build (Recomanat per a XAMPP/Laragon)
1. Executa `npm run build` a la carpeta de l'editor React.
2. Copia el contingut de la carpeta `dist` a `C:\laragon\www\css-editor-test\editor`.

#### Opció B: Servir-ho tot des de Vite (Més ràpid per a dev)
Aquest projecte ja deixa `example-web.html` i `preview-module.js` dins de `public`, de manera que es poden servir directament des del mateix port de Vite (normalment `http://localhost:3000`).

Passos recomanats:

1. Executa `npm run dev`
2. Obre `http://127.0.0.1:3000/example-web.html?session=PROVA123`
3. Obre `http://127.0.0.1:3000/?session=PROVA123`

També pots validar aquest flux automàticament amb `npm run test:e2e`.

## Flux de prova pas a pas

1.  **Obre la Web de Preview**:
    Navega a `http://localhost/css-editor-test/example-web.html?session=PROVA123`.
    *(És important afegir el paràmetre `?session=...` manualment la primera vegada).*

2.  **Obre l'Editor**:
    Navega a `http://localhost/css-editor-test/editor/index.html?session=PROVA123`.
    *(Assegura't que el valor de `session` sigui EXACTAMENT el mateix).*

3.  **Verificació del Handshake**:
    - A l'editor, hauries de veure el badge verd: **PREVIEW CONNECTADA**.
    - A la llista de targets haurien d'aparèixer elements com `home.title`, `form.label`, etc.

4.  **Proves d'edició**:
    - Selecciona `home.title`. Hauries de veure un contorn blau a la web de preview.
    - Canvia el `color` a `#ff0000` o el `fontSize` a `60px`. Hauries de veure el canvi instantani a l'altra finestra.

## Solucio de problemes

- **No es connecten**: Obre la consola del navegador (F12) a les dues finestres. Verifica que el `sessionId` que apareix al log sigui el mateix i que no hi hagi errors de seguretat (CORS).
- **Propietats no s'apliquen**: Recorda que l'Editor bloqueja caràcters perillosos com `;`. Escriu només el valor (ex: `red`, no `red;`).
- **Netejar estils**: Per provar l'eliminació, passa el ratolí sobre una propietat editada a l'editor i prem la "X". L'estil hauria de tornar al valor original de la web.

## Llista curta de verificacio

- `npm run test:e2e` passa
- `npm run dev` arrenca sense errors
- l'editor mostra `Preview Connectada`
- la sidebar mostra targets reals
- un canvi de `color` o `fontSize` es veu a la preview
