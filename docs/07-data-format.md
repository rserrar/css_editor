# Format de dades

## Objectiu

Definir el format exportable real del projecte i les regles mínimes de compatibilitat entre versions.

## Versió actual

L'editor exporta i persisteix `ProjectFile` en `schemaVersion: 2`.

L'editor continua acceptant fitxers antics (`schemaVersion: 1`) i els normalitza internament al format nou.

## Estructura actual

```json
{
  "schemaVersion": 2,
  "project": {
    "projectId": "client-a-main-site",
    "name": "Client A - Web principal",
    "baseUrl": "https://staging.client-a.com",
    "siteKey": "client-a-main-site",
    "createdAt": "2026-04-17T09:00:00.000Z",
    "updatedAt": "2026-04-17T10:15:00.000Z"
  },
  "sourcePreview": {
    "protocolVersion": 1,
    "moduleVersion": "1.0.0",
    "page": {
      "url": "https://staging.client-a.com/contacte",
      "origin": "https://staging.client-a.com",
      "title": "Contacte"
    },
    "site": {
      "siteKey": "client-a-main-site",
      "siteName": "Client A - Web principal",
      "environment": "staging"
    },
    "editable": {
      "knownTargets": [
        "contact.home.title",
        "contact.form.label"
      ],
      "count": 2
    },
    "capturedAt": "2026-04-17T10:15:00.000Z"
  },
  "config": {
    "contact.home.title": {
      "fontSize": "32px",
      "color": "#222222"
    }
  }
}
```

## Blocs del fitxer

### `schemaVersion`

Versió de l'esquema exportable.

- actual: `2`
- suportat a importació: `1` i `2`

### `project`

Identitat estable del projecte.

- `projectId`: identificador intern
- `name`: nom visible a l'editor
- `baseUrl`: URL base esperada per a la preview
- `siteKey`: identitat estable del lloc, si es coneix
- `createdAt` / `updatedAt`: traçabilitat bàsica

### `sourcePreview`

Snapshot informatiu de la preview amb què es va treballar.

- no és la font de veritat dels estils
- serveix per compatibilitat, debugging i traçabilitat
- es pot enriquir amb l'última preview connectada durant export o autosave

### `config`

Configuració real d'estils.

- continua sent la font de veritat
- shape: `Record<string, EditableStyleSet>`
- les claus són `targets` (`data-editable`)
- els valors són propietats CSS permeses i normalitzades

## Regles de compatibilitat

- el fitxer l'exporta i l'importa només l'editor
- la web no genera ni persisteix aquest fitxer
- la importació ha de validar i normalitzar l'esquema abans de continuar
- els drafts locals també s'han de persistir en el format actual
- un fitxer antic mai no ha de fer fallar l'editor; s'ha de migrar si és possible

## Notes pràctiques

- `sourcePreview` pot faltar en fitxers antics o mínims
- si no hi ha `siteKey`, el sistema pot fer fallback a `baseUrl` o a la URL de preview segons context
- `updatedAt` es refresca quan es persisteix o s'exporta el projecte
