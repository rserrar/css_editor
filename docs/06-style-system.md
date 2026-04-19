# Sistema d'estils

## Filosofia

No hi ha CSS lliure. El sistema és controlat i segur.

L'editor treballa sobre un conjunt finit de propietats i les claus de `config` es corresponen amb `data-editable` de la web.

## Claus (`targets`)

Format recomanat:

```txt
vista.component.rol
```

Exemples:

- `contacto.title`
- `contacto.form.label`
- `home.hero.buttonPrimary`

Per a la convenció completa d'integració i exemples bons/dolents, consulta `docs/preview-integration.md`.

Per al model complet de grups repetits, nested elements, `scope` i estats, consulta `docs/18-html-markup-and-grouping.md`.

## Propietats permeses

- `fontFamily`
- `fontSize`
- `fontWeight`
- `lineHeight`
- `letterSpacing`
- `color`
- `backgroundColor`
- `marginTop`
- `marginBottom`
- `marginLeft`
- `marginRight`
- `paddingTop`
- `paddingBottom`
- `paddingLeft`
- `paddingRight`
- `borderColor`
- `borderWidth`
- `borderRadius`

## Propietats prohibides

- `display`
- `position`
- `flex`
- `grid`
- `width`
- `height`
- `transform`

## Edició guiada

L'editor actual no mostra un únic input genèric per a totes les propietats.

- `color` fa servir input de color + text
- `size` i `spacing` fan servir número + unitat
- `select` fa servir dropdown
- els valors es validen i normalitzen abans d'entrar al `config`

## Variants d'estat suportades avui

El sistema actual admet dos formats compatibles de `config`:

### Legacy

```json
{
  "button.primary": {
    "color": "#000000"
  }
}
```

Aquest format continua significant estil `default`.

### Stateful

```json
{
  "button.primary": {
    "default": { "color": "#000000" },
    "hover": { "color": "#ff0000" },
    "selected": { "fontWeight": "700" }
  }
}
```

## Estats executables avui

### CSS estàndard

- `default`
- `hover`
- `focus`
- `active`
- `disabled`

### Semàntics limitats

- `selected`
- `open`

Els estats semàntics tenen mapping explícit i limitat:

- `selected` aplica a `[aria-selected="true"]` i `[aria-current="page"]`
- `open` aplica a `[data-state="open"]` i `[aria-expanded="true"]`

No hi ha suport encara per altres estats semàntics com `expanded`, `checked` o `current` com a estats separats.
