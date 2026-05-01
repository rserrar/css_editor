---
name: prepare-editable-html
description: Guia practica per etiquetar qualsevol pagina web amb data-editable-scope i data-editable per fer-la editable amb Live CSS Visual Editor.
---

# Preparar HTML editable per Live CSS Visual Editor

## Objectiu del skill

Aquesta guia explica com marcar una pagina web real perque l'editor pugui detectar targets, agrupar-los correctament i aplicar estils per estat sense ambiguitats.

La font de veritat d'aquest document es el codi actual del projecte, especialment:

- `public/preview-module.js`
- `src/domain/targetKey.ts`
- `src/domain/models.ts`
- `public/example-web.html`

## Abans de començar (critic)

Aquestes condicions son necessaries perque la connexio editor + preview funcioni en webs reals:

1. la preview s'ha d'obrir des de l'editor (no manualment) per mantenir la referencia de finestra
2. la URL de la preview ha de portar `?session=...` (l'editor la posa automaticament)
3. la pagina editable ha de carregar `preview-module.js`
4. si la web es `https`, el `preview-module.js` tambe s'ha de servir per `https`

Important de produccio:

- no enllacis `https://la-teva-web` amb un script `http://localhost:3000/preview-module.js`
- els navegadors bloquegen aquest cas per mixed content
- allotja una copia de `preview-module.js` al mateix entorn de la web (mateix protocol `https`)

Exemple recomanat:

```html
<script
  src="/preview-module.js"
  data-site-key="client-marketing-site"
  data-site-name="Client Marketing Site"
></script>
```

`data-site-key` i `data-site-name` son opcionals pero recomanats per identificacio.

## Resum rapid per a desenvolupadors

- cada element editable ha de tenir `data-editable-scope` i `data-editable` al mateix node
- la key canonica sempre es `scope/target`
- `scope` identifica el grup o instancia del component
- `target` identifica la peça reutilitzable dins del grup
- si tens elements repetits, tots comparteixen la mateixa key canonica
- els estats no es posen dins `data-editable`
- els estats suportats realment per preview/editor son: `default`, `hover`, `focus`, `active`, `disabled`, `selected`, `open`
- perque `selected` i `open` funcionin, el DOM ha de tenir els atributs semantics correctes, per exemple `aria-selected="true"`, `aria-current="page"`, `data-state="open"` o `aria-expanded="true"`
- tot i que a `src/domain/styleStates.ts` apareixen altres ids semantics, la preview actual nomes aplica runtime per aquests set estats

## Contracte HTML obligatori

Cada node editable ha de portar els dos atributs:

```html
<button
  data-editable-scope="layout.mainMenu"
  data-editable="menu.option"
>
  Productes
</button>
```

La key canonica generada es:

```txt
layout.mainMenu/menu.option
```

Regles reals segons el codi:

- `data-editable-scope` es obligatori
- `data-editable` es obligatori
- tots dos es llegeixen directament del mateix element
- el sistema ja no hereta `scope` des d'un pare
- si falta `data-editable-scope`, la preview ignora l'element i fa `console.warn`
- si `scope` o `target` son buits o contenen `/` de manera invalida, la key es considera malformada

## Convencio de noms recomanada

Fes servir noms consistents i previsibles.

### Per a `scope`

Usa el context o instancia del bloc:

- `home.hero`
- `home.subscription`
- `layout.mainMenu`
- `layout.footerMenu`
- `productTable.main`
- `faq.list`
- `tabs.main`

### Per a `target`

Usa la peça interna del component:

- `hero.title`
- `hero.subtitle`
- `menu.title`
- `menu.option`
- `menu.subOption`
- `form.label`
- `form.input`
- `form.button`
- `card.title`
- `card.description`
- `table.cell`
- `tab.option`
- `accordion.trigger`

### Recomanacio practica

- `scope` = on viu la peça
- `target` = quina peça es
- no posis indexos ni ids aleatoris si vols que elements repetits comparteixin estil
- fes servir punts `.` per llegibilitat, no barregis guions, punts i noms arbitraris sense criteri

## Exemples bons i dolents

### Bo

```html
<h1 data-editable-scope="home.hero" data-editable="hero.title">
  Benvinguts
</h1>
```

### Bo: elements repetits agrupats

```html
<a data-editable-scope="layout.mainMenu" data-editable="menu.option">Inici</a>
<a data-editable-scope="layout.mainMenu" data-editable="menu.option">Productes</a>
<a data-editable-scope="layout.mainMenu" data-editable="menu.option">Preus</a>
```

Tots tres comparteixen la mateixa key:

```txt
layout.mainMenu/menu.option
```

### Dolent: falta scope

```html
<h1 data-editable="hero.title">Benvinguts</h1>
```

Problema: la preview l'ignora.

### Dolent: posar el scope al pare i esperar herencia

```html
<section data-editable-scope="home.hero">
  <h1 data-editable="hero.title">Benvinguts</h1>
</section>
```

Problema: el codi actual no hereta el scope del pare.

### Dolent: ficar l'estat al target

```html
<button data-editable-scope="tabs.main" data-editable="tab.option.selected">
  Descripcio
</button>
```

Problema: els estats no formen part de `data-editable`.

### Dolent: key malformada

```html
<button data-editable-scope="layout/mainMenu" data-editable="menu.option">
  Productes
</button>
```

Problema: `scope` i `target` no poden contenir el separador `/` internament.

## Integracio minima completa (plantilla)

Si comences de zero, aquesta es la base minima funcional:

```html
<!doctype html>
<html lang="ca">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pagina editable</title>
  </head>
  <body>
    <h1 data-editable-scope="home.hero" data-editable="hero.title">Benvinguts</h1>
    <a data-editable-scope="home.hero" data-editable="hero.cta" href="/contacte">Contacta</a>

    <script
      src="/preview-module.js"
      data-site-key="demo-site"
      data-site-name="Demo Site"
    ></script>
  </body>
</html>
```

Despres, obre l'editor i posa la URL d'aquesta pagina. L'editor obre la preview amb la sessio correcta.

## Patrons habituals

### Hero

```html
<section class="hero">
  <h1 data-editable-scope="home.hero" data-editable="hero.title">
    Solucions per equips moderns
  </h1>

  <p data-editable-scope="home.hero" data-editable="hero.subtitle">
    Automatitza processos i escala millor.
  </p>

  <a href="/contacte" data-editable-scope="home.hero" data-editable="hero.cta">
    Demanar demo
  </a>
</section>
```

### Menu principal

```html
<nav>
  <h2 data-editable-scope="layout.mainMenu" data-editable="menu.title">
    Menu principal
  </h2>

  <a href="/" data-editable-scope="layout.mainMenu" data-editable="menu.option">Inici</a>
  <a href="/productes" data-editable-scope="layout.mainMenu" data-editable="menu.option">Productes</a>
  <a href="/preus" data-editable-scope="layout.mainMenu" data-editable="menu.option">Preus</a>
</nav>
```

### Submenu

```html
<div class="submenu">
  <a href="/hosting" data-editable-scope="layout.mainMenu" data-editable="menu.subOption">Hosting</a>
  <a href="/dominis" data-editable-scope="layout.mainMenu" data-editable="menu.subOption">Dominis</a>
</div>
```

Si el submenu pertany al mateix menu i ha de compartir estil, reusa el mateix `scope`.

Si es un altre bloc independent, crea un altre `scope`, per exemple `layout.accountMenu`.

### Formulari

```html
<form>
  <h2 data-editable-scope="contact.form" data-editable="form.title">
    Contacta amb nosaltres
  </h2>

  <label for="email" data-editable-scope="contact.form" data-editable="form.label">
    Email
  </label>
  <input id="email" type="email" />

  <button type="submit" data-editable-scope="contact.form" data-editable="form.button">
    Enviar
  </button>
</form>
```

Normalment no cal marcar l'`input` si el que vols editar es el copy i els CTA. Marca nomes els nodes que realment s'han d'estilitzar des de l'editor.

### Cards repetides

```html
<section class="feature-grid">
  <article>
    <h3 data-editable-scope="home.features" data-editable="card.title">Rapid</h3>
    <p data-editable-scope="home.features" data-editable="card.description">Configuracio en minuts.</p>
  </article>

  <article>
    <h3 data-editable-scope="home.features" data-editable="card.title">Segur</h3>
    <p data-editable-scope="home.features" data-editable="card.description">Xifrat i permisos clars.</p>
  </article>
</section>
```

Aqui tots els titols comparteixen estil i totes les descripcions comparteixen estil.

### Taula

```html
<table>
  <thead>
    <tr>
      <th data-editable-scope="pricing.table" data-editable="table.headCell">Pla</th>
      <th data-editable-scope="pricing.table" data-editable="table.headCell">Preu</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-editable-scope="pricing.table" data-editable="table.cell">Basic</td>
      <td data-editable-scope="pricing.table" data-editable="table.cell">9 EUR</td>
    </tr>
    <tr>
      <td data-editable-scope="pricing.table" data-editable="table.cell">Pro</td>
      <td data-editable-scope="pricing.table" data-editable="table.cell">29 EUR</td>
    </tr>
  </tbody>
</table>
```

Si necessites una columna amb estil diferent, crea un altre target, per exemple `table.priceCell`.

### Tabs

```html
<div class="tabs">
  <h2 data-editable-scope="tabs.main" data-editable="tabs.title">Plans</h2>

  <button data-editable-scope="tabs.main" data-editable="tab.option" aria-selected="true">
    Mensual
  </button>
  <button data-editable-scope="tabs.main" data-editable="tab.option">
    Anual
  </button>
</div>
```

`selected` funciona quan el mateix node te `aria-selected="true"` o `aria-current="page"`.

### Accordion

```html
<section class="faq">
  <h2 data-editable-scope="faq.list" data-editable="accordion.title">
    Preguntes frequents
  </h2>

  <button data-editable-scope="faq.list" data-editable="accordion.trigger" data-state="open">
    Que inclou?
  </button>

  <button data-editable-scope="faq.list" data-editable="accordion.trigger">
    Preus
  </button>
</section>
```

`open` funciona quan el mateix node te `data-state="open"` o `aria-expanded="true"`.

## Regles per elements repetits

- si molts elements han de compartir estil, dona'ls exactament el mateix `scope` i `target`
- no facis `card.title.1`, `card.title.2`, `card.title.3` si visualment han de ser iguals
- si dos grups semblants han de tenir estil diferent, separa'ls per `scope`

Exemple:

```html
<h3 data-editable-scope="home.features" data-editable="card.title">Rapid</h3>
<h3 data-editable-scope="home.features" data-editable="card.title">Segur</h3>
<h3 data-editable-scope="pricing.cards" data-editable="card.title">Enterprise</h3>
```

Aqui hi ha dues keys diferents:

```txt
home.features/card.title
pricing.cards/card.title
```

## Regles per elements niuats

- posa sempre els atributs a cada node editable individual
- no depenguis d'un contenidor amb `data-editable-scope`
- el sistema actual no busca el scope al pare amb `closest()`

### Correcte

```html
<article>
  <h3 data-editable-scope="blog.featured" data-editable="card.title">Nova funcionalitat</h3>
  <p data-editable-scope="blog.featured" data-editable="card.description">Text resum.</p>
</article>
```

### Incorrecte

```html
<article data-editable-scope="blog.featured">
  <h3 data-editable="card.title">Nova funcionalitat</h3>
  <p data-editable="card.description">Text resum.</p>
</article>
```

## Regles per estats

Els estats viuen al config, no a l'HTML de `data-editable`.

### `default`

- sempre existeix al config
- representa l'estil base del target

```json
{
  "layout.mainMenu/menu.option": {
    "default": {
      "color": "#222222"
    }
  }
}
```

### `hover`

- aplica amb `:hover`
- no cal cap atribut extra si el node suporta hover normal

### `focus`

- aplica amb `:focus`
- util per botons, links, inputs, tabs navegables

### `active`

- aplica amb `:active`
- util en botons i enllaços durant la interaccio

### `disabled`

- el selector real es `:disabled`
- perque sigui fiable, fes servir elements que realment puguin estar `disabled`, com `button`, `input`, `select`, `textarea`
- tot i que la documentacio interna menciona `aria-disabled`, la preview actual aplica `disabled` com a pseudo-classe CSS

### `selected`

Segons `public/preview-module.js`, es detecta amb:

- `aria-selected="true"`
- `aria-current="page"`

Exemple:

```html
<button data-editable-scope="tabs.main" data-editable="tab.option" aria-selected="true">
  Descripcio
</button>

<a data-editable-scope="layout.footerMenu" data-editable="menu.option" aria-current="page">
  Contacte
</a>
```

### `open`

Segons `public/preview-module.js`, es detecta amb:

- `data-state="open"`
- `aria-expanded="true"`

Exemple:

```html
<button data-editable-scope="faq.list" data-editable="accordion.trigger" data-state="open">
  Que inclou?
</button>

<button data-editable-scope="filters.panel" data-editable="filter.trigger" aria-expanded="true">
  Categoria
</button>
```

## Com provar que la pagina esta ben etiquetada

### Revisio rapida al DOM

Comprova que cada node editable tingui aquesta forma:

```html
<element data-editable-scope="..." data-editable="..."></element>
```

### Revisio de claus

Comprova que no existeixin casos com:

- `data-editable` sense `data-editable-scope`
- `data-editable-scope=""`
- `data-editable=""`
- `scope` amb `/`
- `target` amb `/`

### Prova funcional amb l'editor

1. serveix la pagina junt amb `preview-module.js`
2. afegeix `?session=123` a la URL de preview
3. obre l'editor amb la mateixa sessio
4. comprova que la sidebar mostra targets `scope/target`
5. selecciona un target repetit i verifica que es ressalten o s'actualitzen tots els nodes equivalents
6. prova `hover`, `focus`, `selected` i `open` en components que els facin servir

Nota practica:

- si obres la preview manualment en una altra pestanya i no des de l'editor, pots tenir errors de `postMessage` per origen o finestra incorrecta
- en cas de dubte, tanca popups antigues i torna a iniciar el flux des de l'editor

### Prova de senyals semantiques

- `selected`: comprova un node amb `aria-selected="true"` o `aria-current="page"`
- `open`: comprova un node amb `data-state="open"` o `aria-expanded="true"`

## Checklist final abans de donar la web per preparada

- tots els nodes editables tenen `data-editable-scope`
- tots els nodes editables tenen `data-editable`
- `scope` i `target` son no buits
- cap `scope` o `target` conte `/`
- els elements repetits comparteixen la mateixa key quan toca
- els grups que han de diferir tenen `scope` diferent
- els estats no estan codificats dins `data-editable`
- els nodes que han de reaccionar a `selected` tenen `aria-selected="true"` o `aria-current="page"`
- els nodes que han de reaccionar a `open` tenen `data-state="open"` o `aria-expanded="true"`
- s'ha provat la pagina amb una sessio real de preview

## Errors habituals i com evitar-los

### Error: posar el scope nomes al contenidor

Problema:

```html
<section data-editable-scope="home.hero">
  <h1 data-editable="hero.title">Title</h1>
</section>
```

Solucio:

```html
<h1 data-editable-scope="home.hero" data-editable="hero.title">Title</h1>
```

### Error: fer una key massa especifica per cada item repetit

Problema:

```html
<li data-editable-scope="home.features" data-editable="card.title.1">Rapid</li>
<li data-editable-scope="home.features" data-editable="card.title.2">Segur</li>
```

Solucio:

```html
<li data-editable-scope="home.features" data-editable="card.title">Rapid</li>
<li data-editable-scope="home.features" data-editable="card.title">Segur</li>
```

### Error: posar l'estat dins el target

Problema:

```html
<button data-editable-scope="tabs.main" data-editable="tab.option.hover">Mensual</button>
```

Solucio:

```html
<button data-editable-scope="tabs.main" data-editable="tab.option">Mensual</button>
```

I deixa que l'estat visqui al config.

### Error: voler que `selected` funcioni sense atribut semantic

Problema:

```html
<button data-editable-scope="tabs.main" data-editable="tab.option">Mensual</button>
```

Solucio:

```html
<button data-editable-scope="tabs.main" data-editable="tab.option" aria-selected="true">Mensual</button>
```

### Error: carregar el script de preview amb protocol incorrecte

Problema tipic:

```html
<!-- Pagina en https -->
<script src="http://localhost:3000/preview-module.js"></script>
```

Conseqüencia: el navegador el bloqueja (mixed content) i la preview no connecta.

Solucio:

```html
<!-- Serveix el script en https al mateix entorn -->
<script src="/preview-module.js"></script>
```

### Error: usar un element no deshabilitable per provar `disabled`

Problema:

```html
<div data-editable-scope="checkout.actions" data-editable="button.primary">Pagar</div>
```

Solucio recomanada:

```html
<button data-editable-scope="checkout.actions" data-editable="button.primary" disabled>
  Pagar
</button>
```

## Nota final de criteri

Si dubtes entre crear un `scope` nou o reutilitzar-ne un, pregunta't aixo:

- aquests elements han de compartir exactament el mateix estil? reutilitza `scope/target`
- aquests elements s'assemblen pero han de poder divergir visualment? crea un `scope` diferent

La regla bona no es “marcar-ho tot”, sino marcar nomes el que l'editor ha de controlar, amb claus estables i reutilitzables.
