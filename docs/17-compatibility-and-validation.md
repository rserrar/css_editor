# Compatibilitat i validació

## Objectiu

Evitar aplicar una configuració a una web equivocada o incompatible, sense bloquejar innecessàriament el treball local.

## Nivells reals de validació

### Nivell 1: comunicació mínima

Obligatori per tenir connexió operativa.

- hi ha `sessionId`
- la preview respon al handshake
- arriba `preview:info:response`
- `protocolVersion` és compatible

Si falla aquest nivell, l'editor no pot validar ni sincronitzar correctament.

### Nivell 2: compatibilitat de projecte

Important.

- coincideix `siteKey` si existeix als dos costats
- si no hi ha `siteKey`, es fa fallback robust a URL/baseUrl
- el fitxer JSON importat és vàlid i migrable

Si hi ha incompatibilitat en aquest nivell, el sistema ho tracta com a `error`.

### Nivell 3: compatibilitat de contingut

Informatiu o `warning`.

- hi ha `targets` del projecte que no existeixen a la preview
- la preview té `targets` nous que no consten al projecte
- si el projecte encara és buit, els targets nous no generen warning sorollós

## Shape del report actual

El sistema calcula un report de compatibilitat amb aquesta idea:

```ts
{
  protocolCompatible: boolean;
  siteCompatible: boolean;
  urlCompatible: boolean | null;
  missingTargetsInPreview: string[];
  newTargetsInPreview: string[];
  severity: 'ok' | 'warning' | 'error';
  messages: string[];
}
```

## Severitat real

- `error`
  - `protocolVersion` incompatible
  - `siteKey` incompatible
  - fallback d'URL incompatible
- `warning`
  - només hi ha diferències de targets
- `ok`
  - no hi ha errors ni warnings rellevants

## Comportament esperat

- errors crítics: mostrar avís fort a l'editor
- incompatibilitats de contingut: permetre continuar amb avís
- permetre obrir o revisar un projecte sense connexió si només es vol editar dades locals

## Relació amb altres documents

- format del projecte: `docs/07-data-format.md`
- protocol editor ↔ preview: `docs/06-communication.md`
- integració de la web: `docs/preview-integration.md`
