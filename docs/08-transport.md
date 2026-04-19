# Transport

## Actual: postMessage entre finestres

```js
previewWindow.postMessage(message, previewOrigin)
window.addEventListener('message', listener)
```

## Avantatges

- Simple
- No cal backend
- Compatible amb editor local + web remota

## Limitacions

- Requereix que l'editor obri la preview o en mantingui la referència
- Depèn de `window.opener` / referència de finestra
- Cal validar `origin` i `sessionId`

## Flux recomanat

- l'usuari obre l'editor
- l'editor obre la preview amb la URL final i la sessió correcta
- la preview respon a l'editor via `window.opener`
- si hi ha un draft o projecte existent, l'editor pot reobrir la mateixa web automàticament

## Futur

### WebSocket

- suport remot
- multiusuari
- persistència central

## Interfície comuna

```ts
interface Transport {
  send(message: ProtocolMessage): void;
  subscribe(handler: (message: ProtocolMessage) => void): () => void;
  close(): void;
}
```
