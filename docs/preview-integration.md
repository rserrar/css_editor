# Preview Integration Guide

Guia curta per integrar `preview-module.js` dins una web real i mantenir un contracte estable amb l'editor.

## 1. Marcatge `data-editable`

Fes servir claus semantiques estables, no lligades al tag HTML.

Format recomanat:

- `vista.component.rol`
- `home.hero.title`
- `pricing.card.cta`
- `checkout.form.label`

Bones practiques:

- mantingues el nom estable encara que canvii el DOM
- no facis servir selectors CSS o noms de tags
- evita claus massa generiques com `title` o `button`
- reutilitza el mateix target si diversos elements han de compartir estil

Exemples:

- bo: `home.hero.title`
- bo: `newsletter.form.button`
- dolent: `h1`
- dolent: `.cta-primary`
- dolent: `button-1`

Si la web té molts elements repetits, nested elements o contextos reutilitzats, consulta també `docs/18-html-markup-and-grouping.md`.

## 2. Incluir el script

Exemple minim:

```html
<script src="/preview-module.js"></script>
```

Exemple recomanat amb configuracio explicita:

```html
<script
  src="/preview-module.js"
  data-site-key="client-marketing"
  data-site-name="Client Marketing Site"
  data-debug="true"
></script>
```

## 3. `sessionId`

El modul llegeix la sessio des del query string:

```txt
https://client-site.test/page?session=PROVA123
```

Sense `session`, el modul no s'activa.

## 4. `siteKey`

Opcions suportades, en ordre de preferencia:

1. `window.__CSS_EDITOR_PREVIEW_CONFIG__.siteKey`
2. `window.__CSS_EDITOR_SITE_KEY__`
3. `data-site-key` al `<script>`
4. fallback automatic al `hostname` normalitzat

Configuracio global recomanada:

```html
<script>
  window.__CSS_EDITOR_PREVIEW_CONFIG__ = {
    siteKey: 'client-marketing',
    siteName: 'Client Marketing Site',
    debug: false,
  };
</script>
<script src="/preview-module.js"></script>
```

Si no defineixes `siteKey`, el modul usa el `hostname` com a fallback conservador.

## 5. `siteName` i `debug`

- `siteName` es pot passar igual que `siteKey`
- `debug: true` activa logs minimament utils de connexio i missatges clau
- si `debug: false`, el modul es manté silencios excepte warnings o errors obvis

## 6. Comportament del modul

- envia `hello` i `config:request` en iniciar-se
- respon a `preview:info:request`
- aplica `style:update`, `style:remove` i `highlight`
- regenera sempre `#live-editor-styles` des del config intern
- si no detecta `data-editable`, avisa per consola pero no falla

### Estats suportats avui

- CSS estàndard: `default`, `hover`, `focus`, `active`, `disabled`
- semàntics limitats: `selected`, `open`

Perquè `selected` i `open` funcionin realment, la web ha d'exposar atributs compatibles al DOM:

- `selected` → `aria-selected="true"` o `aria-current="page"`
- `open` → `data-state="open"` o `aria-expanded="true"`

## 7. Prova local rapida

1. `npm run dev` a `Programa`
2. obre `http://127.0.0.1:3000/example-web.html?session=PROVA123`
3. obre `http://127.0.0.1:3000/?session=PROVA123`
4. comprova connexio, targets, canvi de color i highlight

També pots passar:

```bash
npm run test:e2e
```

## 8. Errors tipics

- no hi ha connexio: editor i preview no comparteixen origen o `session`
- no surten targets: falten `data-editable` o s'han deixat buits
- incompatibilitat de lloc: `siteKey` no coincideix entre projecte i web
- no veus logs: `debug` no esta activat

## 9. Checklist minima

- cada zona editable te `data-editable` semantic i estable
- la preview s'obre amb `?session=...`
- `siteKey` queda definit explicitament si la web es desplega en diversos entorns
- l'editor mostra `Preview Connectada`
- un `style:update` s'aplica i un `style:remove` es neteja correctament
