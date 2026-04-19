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
