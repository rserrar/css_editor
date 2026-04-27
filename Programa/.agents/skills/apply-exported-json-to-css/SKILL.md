---
name: apply-exported-json-to-css
description: Guia practica per convertir el JSON exportat per Live CSS Visual Editor en CSS real integrable a una web original.
---

# Convertir JSON exportat a CSS real

## Objectiu del skill

Aquesta guia explica com agafar un `ProjectFile` exportat per l'editor i convertir-ne el `config` en CSS real, net i integrable al projecte original.

La font de veritat d'aquest document es el codi actual del projecte, especialment:

- `src/domain/models.ts`
- `src/domain/projectService.ts`
- `src/domain/targetKey.ts`
- `src/domain/styleStateHelpers.ts`
- `public/preview-module.js`

## Quan s'ha d'utilitzar aquest skill

Fes servir aquesta guia quan:

- ja tens una web marcada amb `data-editable-scope` i `data-editable`
- l'editor ja ha generat un JSON exportat
- vols portar els canvis visuals a CSS persistent del projecte original
- no vols dependre del `preview-module.js` en produccio

No cal fer servir aquest skill per al runtime de preview: la preview actual ja injecta CSS directament des del `config` rebut.

## Estructura esperada del JSON exportat

Segons `src/domain/models.ts` i `src/domain/projectService.ts`, el fitxer exportat te aquesta forma:

```json
{
  "schemaVersion": 2,
  "project": {
    "projectId": "...",
    "name": "...",
    "baseUrl": "...",
    "siteKey": "...",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "sourcePreview": {
    "protocolVersion": 1,
    "moduleVersion": "1.0.0",
    "page": {
      "url": "...",
      "origin": "...",
      "title": "..."
    },
    "site": {
      "siteKey": "...",
      "siteName": "..."
    },
    "editable": {
      "knownTargets": ["layout.mainMenu/menu.option"],
      "count": 1
    },
    "capturedAt": "..."
  },
  "config": {
    "layout.mainMenu/menu.option": {
      "default": {
        "color": "#222222"
      },
      "hover": {
        "color": "#0055ff"
      }
    }
  }
}
```

Notes reals del codi:

- `schemaVersion` actual suportat: `2`
- `config` ha de ser `Record<string, StatefulStyleSet>`
- cada target ha de tenir com a minim `default`
- els unics estats runtime suportats ara mateix son:
  - `default`
  - `hover`
  - `focus`
  - `active`
  - `disabled`
  - `selected`
  - `open`

## Com llegir `config`

Llegeix nomes `projectFile.config`.

Cada entrada representa un target editable complet:

```json
{
  "tabs.main/tab.option": {
    "default": { "color": "#666666" },
    "selected": { "color": "#111111", "fontWeight": "700" }
  }
}
```

Interpretacio:

- key = target canonic
- valor = estils per estat
- cada propietat CSS esta en camelCase al JSON
- en generar CSS, passa-les a kebab-case, com fa `camelToKebab()` a `public/preview-module.js`

Exemples:

- `fontSize` -> `font-size`
- `backgroundColor` -> `background-color`
- `borderRadius` -> `border-radius`

## Com separar `scope` i `target`

Fes servir exactament la mateixa regla de `src/domain/targetKey.ts`:

- la key ha de tenir exactament un `/`
- la part abans del `/` es `scope`
- la part despres del `/` es `target`
- ni `scope` ni `target` poden ser buits
- ni `scope` ni `target` poden contenir `/`

Exemple:

```txt
layout.mainMenu/menu.option
```

Resultat:

- `scope = layout.mainMenu`
- `target = menu.option`

Si la key es malformada, no generis CSS per aquella entrada. Marca-la com a error de dades.

## Com generar selectors CSS

## Regla base real del projecte

Segons `selectorForKey()` de `public/preview-module.js`, el selector base actual es:

```css
[data-editable-scope="<scope>"][data-editable="<target>"]
```

Important:

- el codi actual espera que `data-editable-scope` i `data-editable` estiguin al mateix element
- no generis selectors descendents com a comportament per defecte
- si la web original encara depen d'un contenidor amb `data-editable-scope`, primer s'ha de corregir l'HTML

### Selector `default`

```css
[data-editable-scope="layout.mainMenu"][data-editable="menu.option"] {
  color: #222222;
}
```

### Selector `hover`

```css
[data-editable-scope="layout.mainMenu"][data-editable="menu.option"]:hover {
  color: #0055ff;
}
```

### Selector `focus`

```css
[data-editable-scope="layout.mainMenu"][data-editable="menu.option"]:focus {
  outline-color: #0055ff;
}
```

### Selector `active`

```css
[data-editable-scope="layout.mainMenu"][data-editable="menu.option"]:active {
  transform: scale(0.98);
}
```

Nota practica: l'editor actual nomes valida un conjunt concret de propietats permeses. Si el JSON ve de l'aplicacio, ja no hi hauria d'haver `transform` perque no es una propietat suportada. L'exemple de dalt es nomes per entendre el selector. En la implementacio real, genera CSS nomes per les propietats presents al JSON.

### Selector `disabled`

```css
[data-editable-scope="checkout.actions"][data-editable="button.primary"]:disabled {
  background-color: #cccccc;
}
```

### Selector `selected`

Segons `SEMANTIC_STATE_SELECTORS.selected` de `public/preview-module.js`, el mapping real es:

```css
[data-editable-scope="tabs.main"][data-editable="tab.option"][aria-selected="true"],
[data-editable-scope="tabs.main"][data-editable="tab.option"][aria-current="page"] {
  font-weight: 700;
}
```

### Selector `open`

Segons `SEMANTIC_STATE_SELECTORS.open` de `public/preview-module.js`, el mapping real es:

```css
[data-editable-scope="faq.list"][data-editable="accordion.trigger"][data-state="open"],
[data-editable-scope="faq.list"][data-editable="accordion.trigger"][aria-expanded="true"] {
  color: #0055ff;
}
```

## Mapping exacte d'estats

Usa aquest mapping, alineat amb el codi actual:

- `default` -> selector base
- `hover` -> `:hover`
- `focus` -> `:focus`
- `active` -> `:active`
- `disabled` -> `:disabled`
- `selected` -> `[aria-selected="true"]`, `[aria-current="page"]`
- `open` -> `[data-state="open"]`, `[aria-expanded="true"]`

No generis selectors per altres ids semantics que puguin apareixer en fitxers auxiliars del repo, com `expanded`, `current` o `checked`, perque la preview actual no els resol com a runtime state oficial.

## Com generar CSS net i llegible

Recomanacio practica:

1. ordena els targets alfabeticament
2. dins de cada target, genera els estats en aquest ordre:
   - `default`
   - `hover`
   - `focus`
   - `active`
   - `disabled`
   - `selected`
   - `open`
3. converteix propietats camelCase a kebab-case
4. omet estats buits
5. omet targets sense declaracions reals
6. separa cada bloc amb una linia en blanc

Exemple de format recomanat:

```css
[data-editable-scope="layout.mainMenu"][data-editable="menu.option"] {
  color: #222222;
  font-size: 16px;
}

[data-editable-scope="layout.mainMenu"][data-editable="menu.option"]:hover {
  color: #0055ff;
}

[data-editable-scope="layout.mainMenu"][data-editable="menu.option"][aria-current="page"],
[data-editable-scope="layout.mainMenu"][data-editable="menu.option"][aria-selected="true"] {
  font-weight: 700;
}
```

## `!important`: quan usar-lo i quan no

La preview actual injecta cada declaracio amb `!important` a `public/preview-module.js` per garantir que els canvis es vegin durant l'edicio.

Per CSS persistent de projecte:

- primer intenta no usar `!important`
- carrega aquest CSS al final o dins d'una capa d'overrides
- si la base existent te molta especificitat i no pots reorganitzar cascada, usa `!important` nomes als casos necessaris

En resum:

- per reproduir el comportament exacte de preview, pots generar `!important`
- per mantenibilitat de produccio, es millor prioritzar ordre de carrega i especificitat controlada

## Com integrar el CSS al projecte

### Opcio 1: fitxer CSS separat

Exemple:

- `editable-overrides.css`
- `marketing-editor-overrides.css`

Avantatges:

- facil de revisar en PR
- facil de regenerar
- separa canvis editorials dels estils estructurals

### Opcio 2: capa override

Si el projecte usa layers CSS:

```css
@layer editor-overrides {
  [data-editable-scope="layout.mainMenu"][data-editable="menu.option"] {
    color: #222222;
  }
}
```

### Ordre de carrega recomanat

- CSS base del projecte
- CSS de components
- CSS responsive
- CSS exportat des de l'editor al final

### Que s'ha d'evitar

- no toquis CSS estructural si el JSON nomes expressa estils visuals suportats per l'editor
- no barregis aquests overrides amb fitxers de layout complex si no es necessari
- no copiïs selectors del DOM real sense mantenir `data-editable-scope` i `data-editable` com a origen de veritat

## Procediment manual i robust per generar CSS

Encara no hi ha un generador oficial standalone al repo. El procediment robust es aquest:

1. valida que `schemaVersion` sigui `2`
2. llegeix `config`
3. per cada key:
   - valida-la amb la mateixa logica de `parseCanonicalKey()`
   - extreu `scope` i `target`
4. per cada estat suportat:
   - comprova si existeix i si te propietats
   - genera el selector corresponent
   - converteix propietats camelCase a kebab-case
   - escriu declarations CSS
5. ignora entrades buides o malformades
6. carrega el fitxer CSS resultant al final de la cascada

Si necessites una referencia funcional, el millor punt de partida es replicar la logica de:

- `selectorForKey()`
- `selectorForState()`
- `camelToKebab()`
- `applyStyles()`

a `public/preview-module.js`.

## Com revisar manualment el resultat

1. carrega la web amb el CSS generat
2. obre eines de desenvolupador
3. comprova un target real, per exemple:

```html
<button data-editable-scope="layout.mainMenu" data-editable="menu.option">
  Productes
</button>
```

4. verifica que les regles CSS arribin al mateix element
5. prova els estats:
   - `hover`
   - `focus`
   - `active`
   - `disabled`
   - `selected`
   - `open`
6. confirma que els elements repetits amb la mateixa key comparteixen el resultat visual

## Com detectar errors comuns

### Key malformada

Exemples de problema:

- `menu.option`
- `scope/`
- `/target`
- `scope/target/extra`

Accio:

- no generis CSS per aquesta entrada
- registra l'error i corregeix l'export o les dades d'origen

### Scope inexistent

Problema:

- el JSON te `layout.mainMenu/menu.option`
- pero la web real no te cap node amb `data-editable-scope="layout.mainMenu"`

Accio:

- revisa l'HTML real
- comprova si el scope es va renombrar
- no canviis el selector per adaptar-lo silenciosament; corregeix la web o el markup

### Target inexistent

Problema:

- existeix el scope
- pero no hi ha cap node amb `data-editable="menu.option"` dins del target real esperat

Accio:

- valida que el node mantingui exactament el mateix `data-editable`

### Estat no suportat

Problema:

- apareix un estat fora de `default`, `hover`, `focus`, `active`, `disabled`, `selected`, `open`

Accio:

- ignora'l o tracta'l com a error de dades
- no inventis selectors nous que no estiguin alineats amb la preview actual

### Propietats buides

Problema:

```json
{
  "layout.mainMenu/menu.option": {
    "default": {}
  }
}
```

Accio:

- no generis cap bloc CSS buit

### Propietat no permesa o valor inconsistent

Segons `src/domain/models.ts`, l'editor treballa amb un conjunt tancat de propietats visuals. Si apareixen propietats externes o valors estranys, revisa si el JSON ha estat manipulat fora del flux normal.

## Checklist final abans de fer commit

- el JSON te `schemaVersion: 2`
- totes les keys de `config` tenen forma `scope/target`
- tots els valors de `config` son stateful i tenen `default`
- nomes es generen selectors per estats suportats
- les propietats estan en kebab-case al CSS final
- no hi ha blocs CSS buits
- el fitxer CSS es carrega al final o en una capa d'override clara
- els selectors apunten a nodes que realment existeixen al projecte
- s'han provat manualment almenys un cas de `hover`, un de `selected` i un de `open` si el projecte els usa
- no s'han modificat estils estructurals fora de l'abast de l'editor

## Exemple complet de JSON a CSS

### HTML

```html
<nav>
  <a data-editable-scope="layout.mainMenu" data-editable="menu.option">Inici</a>
  <a data-editable-scope="layout.mainMenu" data-editable="menu.option" aria-current="page">Productes</a>
</nav>

<section>
  <button data-editable-scope="faq.list" data-editable="accordion.trigger" data-state="open">
    Que inclou?
  </button>
</section>
```

### JSON exportat

```json
{
  "schemaVersion": 2,
  "project": {
    "projectId": "project-1",
    "name": "Marketing site",
    "baseUrl": "https://example.com",
    "siteKey": "example-site",
    "createdAt": "2026-04-27T10:00:00.000Z",
    "updatedAt": "2026-04-27T10:30:00.000Z"
  },
  "config": {
    "layout.mainMenu/menu.option": {
      "default": {
        "color": "#222222",
        "fontSize": "16px"
      },
      "hover": {
        "color": "#0055ff"
      },
      "selected": {
        "fontWeight": "700"
      }
    },
    "faq.list/accordion.trigger": {
      "default": {
        "color": "#222222"
      },
      "open": {
        "color": "#0055ff"
      }
    }
  }
}
```

### CSS resultant recomanat

```css
[data-editable-scope="faq.list"][data-editable="accordion.trigger"] {
  color: #222222;
}

[data-editable-scope="faq.list"][data-editable="accordion.trigger"][data-state="open"],
[data-editable-scope="faq.list"][data-editable="accordion.trigger"][aria-expanded="true"] {
  color: #0055ff;
}

[data-editable-scope="layout.mainMenu"][data-editable="menu.option"] {
  color: #222222;
  font-size: 16px;
}

[data-editable-scope="layout.mainMenu"][data-editable="menu.option"]:hover {
  color: #0055ff;
}

[data-editable-scope="layout.mainMenu"][data-editable="menu.option"][aria-selected="true"],
[data-editable-scope="layout.mainMenu"][data-editable="menu.option"][aria-current="page"] {
  font-weight: 700;
}
```

## Nota final de criteri

No intentis ser mes llest que el contracte.

- si el JSON esta malformat, atura't i corregeix-lo
- si el markup real no coincideix amb `data-editable-scope` + `data-editable` al mateix node, arregla l'HTML abans de generar CSS
- si necessites reproduir exactament la preview, copia la logica de selectors i estat de `public/preview-module.js`

La manera segura d'integrar els canvis es tractar el JSON exportat com a font de veritat editorial i el CSS generat com a capa d'override explicitament controlada.
