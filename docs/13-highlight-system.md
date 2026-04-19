# Sistema de highlight

## Objectiu

Permetre identificar visualment l'element o grup d'elements que s'està editant.

## Missatge

```ts
{
  type: "highlight";
  target: string | null;
}
```

## Comportament recomanat

1. eliminar highlights existents
2. buscar tots els nodes amb el `target` indicat
3. aplicar una classe temporal de highlight
4. si `target` és `null`, netejar el highlight

## CSS base suggerit

```css
.editable-highlight {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```
