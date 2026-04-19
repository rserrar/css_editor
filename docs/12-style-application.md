# Aplicació d'estils a la preview

## Principi

La preview transforma el `config` en CSS i l'injecta dins d'un únic `<style>`.

## Conversió

- `camelCase` -> `kebab-case`
- cada `target` es converteix en un selector `[data-editable="..."]`

## Exemple

Entrada:

```json
{
  "contacto.title": {
    "fontSize": "32px",
    "color": "#222222"
  }
}
```

Sortida:

```css
[data-editable="contacto.title"] {
  font-size: 32px;
  color: #222222;
}
```

## Regles

- no duplicar l'element `<style>`
- regenerar el CSS complet a partir de l'estat actual
- evitar `inline styles`
- el `config` intern de la preview només existeix per reconstruir aquest CSS
