# Protocol de comunicació

## Objectiu

Definir el contracte real entre editor i preview a través de `window.postMessage` entre finestres.

## Transport actual

La comunicació actual es fa entre la finestra de l'editor i la finestra de preview amb `window.postMessage`.

La preview ha d'haver estat oberta des de l'editor o bé mantenir una referència vàlida via `window.opener`.

En el flux normal d'ús, l'usuari no obre manualment dues finestres ni escriu la sessió a mà: l'editor obre la preview i hi injecta el `sessionId` necessari.

## Format base de missatge

Tots els missatges comparteixen aquest shape mínim:

```ts
{
  type: string;
  sessionId: string;
  source: 'editor' | 'preview';
  timestamp: number;
}
```

## Missatges suportats

### `hello`

Serveix per anunciar la presència d'una finestra connectada.

- l'envia l'editor en iniciar-se
- l'envia la preview en iniciar-se
- la preview el pot reenviar per reforçar el handshake si detecta l'editor després

### `preview:info:request`

L'editor demana a la preview el seu context actual.

### `preview:info:response`

La preview retorna el context real de la pàgina.

Shape actual:

```ts
{
  type: 'preview:info:response';
  sessionId: string;
  source: 'preview';
  timestamp: number;
  protocolVersion: number;
  moduleVersion: string;
  page: {
    url: string;
    origin: string;
    title: string;
  };
  site: {
    siteKey: string;
    siteName: string;
    environment?: string;
  };
  editable: {
    targets: string[];
    count: number;
  };
}
```

### `config:request`

La preview demana de nou la configuració completa, per exemple després d'una recàrrega o reconnexió.

### `config:replaceAll`

L'editor envia la configuració completa activa.

Shape:

```ts
{
  type: 'config:replaceAll';
  sessionId: string;
  source: 'editor';
  timestamp: number;
  config: Record<string, EditableStyleSet>;
}
```

### `project:load`

L'editor informa que ha creat o carregat un projecte.

S'utilitza com a senyal de context, no com a font de veritat d'estils.

### `style:update`

Actualitza parcialment un `target`.

Shape:

```ts
{
  type: 'style:update';
  sessionId: string;
  source: 'editor';
  timestamp: number;
  target: string;
  styles: EditableStyleSet;
}
```

### `style:remove`

Elimina una o més claus d'estil d'un `target`.

Shape:

```ts
{
  type: 'style:remove';
  sessionId: string;
  source: 'editor';
  timestamp: number;
  target: string;
  keys: AllowedStyleKey[];
}
```

### `highlight`

Demana ressaltar un `target` o netejar el highlight actual.

Shape:

```ts
{
  type: 'highlight';
  sessionId: string;
  source: 'editor';
  timestamp: number;
  target: string | null;
}
```

## Flux real recomanat

1. l'usuari obre l'editor
2. l'editor obre la preview amb `window.open(...)` i hi afegeix `?session=...`
3. la preview anuncia `hello` + `config:request`
4. l'editor envia `preview:info:request`
5. la preview respon `preview:info:response`
6. l'editor envia `config:replaceAll` quan cal
7. durant l'edició s'envien `style:update`, `style:remove` i `highlight`

## Regles del protocol

- ignorar missatges d'una altra sessió
- ignorar missatges del mateix `source` quan no pertoqui
- no assumir ordre perfecte de lliurament
- poder reconstruir sempre l'estat complet amb `config:replaceAll`
- la preview no guarda projectes ni decideix compatibilitats de negoci

## Relació amb altres documents

- contracte de dades: `docs/07-data-format.md`
- contracte d'integració web: `docs/preview-integration.md`
- compatibilitat i validació: `docs/17-compatibility-and-validation.md`
