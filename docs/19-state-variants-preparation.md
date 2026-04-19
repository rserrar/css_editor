# Variants d'estat

## Objectiu

Documentar què ja és executable avui i què encara queda només preparat per a fases futures.

## Què ja és real avui

- els `targets` continuen sent estables i independents dels estats
- el model `scope + target` ja conviu amb legacy
- el domini i el runtime ja suporten estats CSS estàndard
- el domini, el runtime i l'editor ja suporten `selected` i `open`

## Regla principal

Els estats no formen part de la key editable.

Correcte:

- `layout.mainMenu/menu.option`
- variants futures: `default`, `hover`, `active`

Incorrecte:

- `layout.mainMenu/menu.option.hover`
- `menu.option.selected`

## Catàleg actual

### Ja suportat avui

- estàndard CSS: `default`, `hover`, `focus`, `active`, `disabled`
- semàntics limitats: `selected`, `open`

### Encara només preparat

- `expanded`
- `current`
- `checked`

## Distinció important

### Estats CSS

Són els més fàcils de mapejar a selectors coneguts:

- `hover` → `:hover`
- `focus` → `:focus`
- `active` → `:active`
- `disabled` → `:disabled`

### Estats semàntics

No tenen un mapping universal únic. Avui el sistema suporta només aquests dos casos explícits:

- `selected` → `aria-selected="true"`, `aria-current="page"`
- `open` → `data-state="open"`, `aria-expanded="true"`

La resta continua sent direcció futura:

- `expanded` → possible base: `aria-expanded="true"`
- `current` → possible base: `aria-current`
- `checked` → possible base: `checked`, `aria-checked="true"`, `data-state="checked"`

## Shape actual compatible

El sistema actual ja suporta aquest shape a `config`:

```json
{
  "layout.mainMenu/menu.option": {
    "default": { "color": "#222222" },
    "hover": { "color": "#111111" },
    "selected": { "fontWeight": "700" }
  }
}
```

També es manté vàlid el format legacy pla:

```json
{
  "layout.mainMenu/menu.option": {
    "color": "#222222"
  }
}
```

## Què NO s'ha implementat encara

- cap canvi al protocol
- suport per altres estats semàntics més enllà de `selected` i `open`
- cap mapping genèric universal per semàntics
- cap UI més rica d'ajuda o documentació dins l'editor més enllà de microajuda contextual

## Per què continua sent útil aquest document

- deixa clar què ja és executable i què no
- manté separats `target`, `scope` i `state`
- redueix el risc d'embrutar `data-editable` amb variants semàntiques o pseudoestats

## Relació amb altres documents

- `docs/18-html-markup-and-grouping.md`
- `docs/06-style-system.md`
- `docs/09-future-improvements.md`
