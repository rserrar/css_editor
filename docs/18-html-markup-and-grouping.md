# Model de marcatge HTML i agrupació editable

## Objectiu

Definir com s'han de marcar els elements d'una web real perquè l'editor treballi amb grups d'estil coherents, especialment en casos amb repeticions, nested elements i estats.

Aquest document no introdueix una arquitectura nova. Ordena i concreta com s'ha de pensar el marcatge perquè encaixi amb el sistema actual.

## Punt de partida real del sistema

Avui el contracte executable mínim és aquest:

- el preview-module detecta elements amb `data-editable`
- la preview deduplica per valor de `data-editable`
- l'editor treballa amb `targets`, no amb nodes individuals del DOM
- `config` continua sent `Record<string, EditableStyleSet>`

Per tant, **l'únic atribut realment obligatori avui perquè el sistema funcioni és `data-editable`**.

La resta d'atributs documentats aquí s'han d'entendre com a model de marcatge recomanat per integracions reals i escalables.

## Principi clau

L'editor no treballa per nodes del DOM. Treballa per grups d'estil.

Conseqüència directa:

- 40 opcions de menú amb el mateix estil no s'han d'editar com 40 entrades diferents
- s'han de mapar a un únic grup lògic

## Dimensions que cal separar

Quan marques una web, convé separar aquests conceptes:

- què és editable
- quin grup comparteix estil
- en quin context viu
- quina instància concreta hi ha al DOM
- quin element és representatiu, si mai cal identificar-ne un

No és recomanable codificar totes aquestes dimensions dins un únic nom ambigu.

## Contracte de marcatge recomanat

### 1. `data-editable`

Identifica el grup d'estil compartit.

Exemples:

- `menu.option`
- `menu.subOption`
- `form.label`
- `card.title`

Regles:

- ha de ser semàntic i estable
- no ha de dependre del tag HTML
- no ha d'incloure estats (`hover`, `active`, etc.)
- si diversos elements comparteixen estil, han de compartir el mateix `data-editable`

### 2. `data-editable-scope`

Identifica el context funcional on viu aquell grup.

Exemples:

- `layout.mainMenu`
- `contact.form`
- `home.features`

Regles:

- serveix per distingir contextos que poden reutilitzar el mateix target
- no substitueix `data-editable`; el complementa
- si dos elements no han de compartir estil, poden diferir en `scope`, en `target`, o en tots dos

### 3. Atributs opcionals reservats

#### `data-editable-master="true"`

Opcional.

Pot marcar un element representatiu dins d'un grup repetit.

Ús recomanat:

- debugging
- inspecció visual futura
- casos on calgui un node preferent per scroll o inspecció

No s'ha d'entendre com “només aquest element és editable i els altres hereten”.

#### `data-editable-ignore="true"`

Opcional.

Pensat per deixar fora nodes que visualment semblen editables però no han de formar part del model.

Exemple típic:

- wrappers auxiliars
- duplicats tècnics d'una llibreria UI
- contingut decoratiu

#### `data-editable-instance`

Opcional.

Només recomanable per debugging o traçabilitat de repeticions. No ha de formar part del contracte d'estil.

## Regles finals de grups compartits

- mateix estil compartit → mateix `data-editable`
- mateix context funcional → mateix `data-editable-scope`
- si no han de compartir estil → target diferent o scope diferent
- el DOM per si sol no defineix la jerarquia d'estils

## Nested elements

No s'ha de confiar en la profunditat del DOM per decidir el nivell lògic.

Millor:

- `menu.option`
- `menu.subOption`

Pitjor:

- deduir nivell 1 i nivell 2 segons la posició al DOM

Exemple recomanat:

```html
<nav data-editable-scope="layout.mainMenu">
  <a data-editable="menu.option">Productes</a>
  <div>
    <a data-editable="menu.subOption">Editors</a>
    <a data-editable="menu.subOption">Themes</a>
  </div>
</nav>
```

Aquí el nivell queda explícit al target, no amagat a l'estructura del DOM.

## Elements repetits

### Menús

```html
<nav data-editable-scope="layout.mainMenu">
  <a data-editable="menu.option" data-editable-master="true">Inici</a>
  <a data-editable="menu.option">Productes</a>
  <a data-editable="menu.option">Preus</a>
</nav>
```

El sistema s'ha de pensar com un únic grup editable: `layout.mainMenu/menu.option`.

### Formulari

```html
<form data-editable-scope="contact.form">
  <label data-editable="form.label">Nom</label>
  <label data-editable="form.label">Email</label>
  <button data-editable="form.button">Enviar</button>
</form>
```

### Cards repetides

```html
<section data-editable-scope="home.features">
  <article>
    <h3 data-editable="card.title" data-editable-master="true">Ràpid</h3>
    <p data-editable="card.body">Text</p>
  </article>
  <article>
    <h3 data-editable="card.title">Segur</h3>
    <p data-editable="card.body">Text</p>
  </article>
</section>
```

### Taula

```html
<table data-editable-scope="pricing.table">
  <thead>
    <tr>
      <th data-editable="table.header">Pla</th>
      <th data-editable="table.header">Preu</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-editable="table.cell">Starter</td>
      <td data-editable="table.cell">9 EUR</td>
    </tr>
  </tbody>
</table>
```

## Com s'ha de pensar la clau lògica

Conceptualment, per integracions reals, la clau bona és:

```txt
scope + target
```

Per exemple:

```txt
layout.mainMenu/menu.option
contact.form/form.label
home.features/card.title
```

## Important sobre el codi actual

Amb el codi actual, la discovery i el `config` treballen només amb `data-editable`.

Per tant:

- `data-editable-scope` ja es pot fer servir com a convenció d'integració
- però encara no participa automàticament en el `target` descobert per la preview
- si dues zones diferents reutilitzen el mateix `data-editable`, avui el sistema les agruparà juntes

Conclusió conservadora:

- **si avui vols distingir dos contextos amb el codi actual, el `data-editable` encara ha de portar aquesta diferència implícita**
- `data-editable-scope` és la direcció correcta per escalar millor el model sense dependre del DOM

Exemple compatible avui:

- `mainMenu.option`
- `footerMenu.option`

Exemple de model recomanat a mitjà termini:

- `data-editable="menu.option"`
- `data-editable-scope="layout.mainMenu"`

## Model d'estats

### Regla principal

Els estats **no formen part de `data-editable`**.

No recomanat:

- `menu.option.hover`
- `menu.option.active`
- `card.title.selected`

Recomanat:

- target estable: `menu.option`
- estats com a segona dimensió del model d'estils

Exemple conceptual:

```json
{
  "layout.mainMenu/menu.option": {
    "default": { "color": "#222222" },
    "hover": { "color": "#111111" },
    "active": { "color": "#000000" }
  }
}
```

Aquest shape encara no és el `config` executable actual. És el model correcte per pensar l'evolució dels estats sense embrutar `data-editable`.

### Estats estàndard CSS

Aquests són els més naturals de mapar:

- `default`
- `hover`
- `focus`
- `active`
- `disabled`

Mapeig esperable:

- `:hover`
- `:focus`
- `:active`
- `:disabled`

### Estats semàntics o de component

Actualment el sistema suporta de manera executable i editable només dos estats semàntics:

- `selected`
- `open`

Mapping explícit actual:

- `selected` → `aria-selected="true"`, `aria-current="page"`
- `open` → `data-state="open"`, `aria-expanded="true"`

La resta continua sent només orientació futura:

- `expanded`
- `current`
- `checked`

Ordre de preferència per representar-los al DOM:

1. atributs semàntics existents (`aria-*`, `disabled`, `checked`)
2. `data-state`
3. només si algun dia fos imprescindible, un atribut específic del sistema

Per al catàleg complet d'estats suportats avui i els que encara queden només preparats, consulta també `docs/19-state-variants-preparation.md`.

Exemple:

```html
<button
  data-editable="menu.option"
  data-editable-scope="layout.mainMenu"
  aria-current="page"
>
  Productes
</button>

<button
  data-editable="accordion.trigger"
  data-editable-scope="faq.list"
  data-state="open"
>
  Què inclou?
</button>
```

## Quins `data-*` són base, opcionals o no recomanats

### Base avui

- `data-editable`

### Recomendats per integracions reals

- `data-editable-scope`

### Opcionals

- `data-editable-master="true"`
- `data-editable-ignore="true"`
- `data-editable-instance`

### No recomanats

- posar estats dins `data-editable`
- barrejar context, rol i instància en un nom arbitrari
- confiar en la profunditat del DOM per distingir nivells lògics

## Relació entre DOM, preview-module, editor i config

### DOM

Exposa grups editables amb `data-editable` i, si es vol, context amb `data-editable-scope`.

### preview-module

Avui:

- escaneja `data-editable`
- deduplica targets
- envia `editable.targets` a l'editor
- aplica CSS per target
- aplica també variants d'estat CSS i, de forma limitada, `selected` i `open`

### editor

- mostra i selecciona targets lògics
- no ha de treballar amb cada node individual del DOM

### config

Avui:

- està indexat per target descobert
- ja pot contenir una segona dimensió d'estat per `default`, `hover`, `focus`, `active`, `disabled`, `selected` i `open`

Per això és important que el marcatge de la web ja es pensi bé des d'ara, especialment per als casos de `selected` i `open` on el runtime depèn d'atributs semàntics explícits.

## Relació amb altres documents

- integració pràctica del preview-module: `docs/preview-integration.md`
- sistema d'estils: `docs/06-style-system.md`
- contracte del protocol: `docs/06-communication.md`
