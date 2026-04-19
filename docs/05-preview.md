# Mòdul de web / preview

## Objectiu

El mòdul de web és una capa lleugera que s'instal·la a la web a editar. No és un editor. És un executor i una font de context.

## Responsabilitats

- inicialitzar la comunicació
- anunciar-se a l'editor
- retornar informació del context real de la web
- detectar els elements amb `data-editable`
- aplicar una configuració d'estils
- ressaltar elements quan l'editor ho demani

## Restriccions

La preview no ha de:

- crear projectes
- decidir compatibilitats de negoci
- guardar fitxers de projecte
- interpretar opcions d'usuari

## Configuració mínima suportada

El mòdul pot rebre configuració opcional de:

- `siteKey`
- `siteName`
- `debug`

Consulta `docs/preview-integration.md` per les formes suportades i exemples d'inclusió del script.

## Identificació d'elements

Els elements editables es marquen així:

```html
<h1 data-editable="contacto.title">Contacte</h1>
<label data-editable="contacto.form.label">Nom</label>
```

## Aplicació d'estils

Els estils rebuts es converteixen en CSS i s'injecten dins d'un únic element:

```html
<style id="live-editor-styles"></style>
```

## Reconnexió

Si la preview es recarrega, ha de poder:

1. reconnectar-se al canal
2. tornar a anunciar-se
3. tornar a sol·licitar la configuració si cal

## Contracte detallat

Per al contracte complet de missatges i shape actual del protocol, consulta `docs/06-communication.md`.
