# Gestió de sessions

## Objectiu

Evitar interferències entre múltiples finestres i separar la sessió temporal del projecte persistent.

## `sessionId`

Cada connexió editor-preview es basa en un `sessionId`, normalment generat amb:

```js
crypto.randomUUID()
```

## Passat via URL

El `sessionId` s'afegeix automàticament quan l'editor obre la preview.

```txt
/preview?session=<sessionId>
```

## Vincle entre finestres

La sessió actual es basa en:

- `sessionId` compartit per URL
- finestra de preview oberta des de l'editor
- comunicació via `window.postMessage`

L'usuari no ha d'escriure manualment `?session=...` en el flux normal.

## Diferència entre sessió i projecte

### Sessió

És temporal i només serveix per a la comunicació activa.

### Projecte

És persistent i s'exporta o importa en el JSON.

## Reconnexió

Si una finestra es recarrega:

1. torna a connectar-se amb la finestra editora si existeix
2. envia `hello`
3. demana o envia la configuració completa segons el seu rol
