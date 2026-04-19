# Overview

## Objectiu

Aquest projecte defineix un sistema d'edició visual d'estils CSS segur, reutilitzable i pensat per a usuaris finals no tècnics.

L'editor funciona en una finestra o pantalla independent de la web. La web a editar continua sent neta i no s'omple de formularis d'administració.

## Abast funcional

El sistema permet editar només propietats visuals segures, com ara:

- tipografia
- colors
- marges i paddings
- vores
- border radius

Queden fora propietats estructurals o perilloses, com ara:

- `display`
- `position`
- `flex`
- `grid`
- `width`
- `height`
- `transform`

## Components principals

### Editor

Aplicació independent, idealment en React + TypeScript.

Responsabilitats:

- crear projectes nous
- carregar projectes existents
- validar compatibilitat amb la web
- mantenir la configuració d'estils
- exportar i importar fitxers JSON
- enviar canvis a la preview
- obrir automàticament la preview a partir d'una URL o d'un projecte amb `baseUrl`
- restaurar sessions o drafts anteriors si existeixen

### Mòdul de web / preview

Codi instal·lat a la web que es vol editar.

Responsabilitats:

- anunciar-se a l'editor
- exposar informació del context real de la web
- detectar els `data-editable`
- aplicar estils en viu
- ressaltar elements

### Shared

Capa comuna amb:

- tipus de missatges
- models de dades
- validacions bàsiques
- helpers de CSS

### Transport

Actualment: `window.postMessage`

Futur possible: `WebSocket`

El flux principal actual assumeix que l'editor obre la preview i manté la relació entre finestres.

## Principis clau

- No hi ha CSS lliure
- El JSON és la font de veritat
- La web no es modifica estructuralment
- El CSS s'aplica amb un `<style id="live-editor-styles">`
- La identificació d'elements es fa amb `data-editable`
- El sistema és multi-projecte
- La comunicació està desacoblada del frontend
