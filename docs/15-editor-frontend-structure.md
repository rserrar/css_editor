# Estructura del frontend de l'editor

## Objectiu

Tenir un frontend modular, amb separació clara entre presentació, casos d'ús simples, domini i infraestructura.

## Estructura actual real

```txt
/Programa/src
  /app
    useEditor.ts

  /domain
    models.ts
    projectService.ts
    compatibilityService.ts
    styleSchema.ts
    styleValidators.ts
    translations.ts

  /infrastructure
    /i18n
    /storage
      draftStorage.ts
    /transport
      PostMessageTransport.ts
      Transport.ts

  /adapters
    PreviewClient.ts

  /presentation
    /components
      StylePanel.tsx
      StyleValueField.tsx
    /pages
      StartScreen.tsx
      EditorPage.tsx
```

## Responsabilitats

### `presentation`

React pur i formularis guiats.

### `app`

Orquestració de l'editor: connexió, càrrega de projecte, draft i sincronització bàsica.

### `domain`

Models, compatibilitat, format versionat, property schema i validació de valors.

### `infrastructure`

Transport, `localStorage`, i18n i runtime dependent del navegador.

### `adapters`

Ponts entre el domini i la preview real.

Actualment el transport principal de l'editor és `postMessage`; la UI no ha de dependre d'aquest detall.

## Evolució recomanada

Si el frontend creix, es pot descompondre més (`TargetSelector`, `ConnectionStatus`, grups d'editors), però avui la solució compacta encara és coherent i mantenible.

## Regla principal

Els components React no han de saber res del protocol més enllà del necessari per mostrar estat i disparar accions.
