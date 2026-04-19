# Estructura del mòdul de preview

## Objectiu

Mantenir el mòdul instal·lat a la web petit, integrable i amb responsabilitats clares, sense exigir cap build complex.

## Estat actual

Actualment el sistema fa servir un únic fitxer drop-in:

```txt
public/preview-module.js
```

Aquest fitxer:

- llegeix `session` des de la URL
- usa `window.postMessage` amb `window.opener`
- anuncia presència (`hello` + `config:request`)
- respon `preview:info:response`
- escaneja `data-editable`
- aplica i neteja estils amb `#live-editor-styles`
- aplica i neteja highlights
- admet configuració mínima (`siteKey`, `siteName`, `debug`)
- renderitza estats CSS estàndard (`default`, `hover`, `focus`, `active`, `disabled`)
- renderitza dos estats semàntics limitats (`selected`, `open`)

## Configuració suportada

Es pot definir via:

- `window.__CSS_EDITOR_PREVIEW_CONFIG__`
- `window.__CSS_EDITOR_SITE_KEY__`
- atributs `data-*` al `<script>`

Exemple:

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

## Responsabilitats reals

### Runtime

- llegir `sessionId`
- resoldre configuració opcional
- inicialitzar la comunicació amb la finestra editora

### Comunicació

- escoltar missatges de l'editor
- enviar context de preview
- tornar a anunciar-se quan calgui per evitar timings fràgils

Actualment el transport principal és `window.postMessage` entre l'editor que obre la preview i la mateixa finestra de preview.

En el flux principal, la preview no s'ha d'obrir manualment amb `?session=...`; l'editor s'encarrega d'obrir-la amb la sessió correcta.

### DOM

- detectar `data-editable`
- aplicar CSS derivat del `config`
- mantenir un únic `<style id="live-editor-styles">`
- netejar highlights i estils fantasma

Per als estats semàntics suportats actualment, el runtime aplica selectors explícits:

- `selected` → `[aria-selected="true"]`, `[aria-current="page"]`
- `open` → `[data-state="open"]`, `[aria-expanded="true"]`

## Regla principal

La web no coneix projectes ni lògica de negoci avançada. Només exposa context, aplica estils i manté un contracte estable amb l'editor.
