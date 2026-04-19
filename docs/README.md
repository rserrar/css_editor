# Documentació canònica

Aquest directori conté documents històrics i documents canònics.

Per evitar contradiccions, fes servir prioritàriament aquests fitxers com a font de veritat actual:

## Núcli

- `docs/01-overview.md` - visió general del sistema
- `docs/02-architecture.md` - arquitectura global i regles d'or
- `docs/03-startup-flows.md` - fluxos d'inici i escenaris principals

## Contractes

- `docs/06-communication.md` - contracte real del protocol editor ↔ preview
- `docs/07-data-format.md` - contracte de dades de `ProjectFile`
- `docs/17-compatibility-and-validation.md` - regles de compatibilitat i severitat

## Editor

- `docs/10-editor-state.md` - model d'estat de l'editor
- `docs/11-react-components.md` - components React reals
- `docs/15-editor-frontend-structure.md` - estructura real del frontend

## Preview / integració web

- `docs/05-preview.md` - responsabilitats i restriccions de la preview
- `docs/16-preview-module-structure.md` - estructura real del preview-module
- `docs/preview-integration.md` - guia pràctica per integrar-ho en una web
- `docs/18-html-markup-and-grouping.md` - contracte de marcatge HTML, grups, nested i estats

## Estils i runtime

- `docs/06-style-system.md` - property model, targets i edició guiada
- `docs/08-transport.md` - transport actual i límits
- `docs/12-style-application.md` - com la preview reconstrueix el CSS
- `docs/13-highlight-system.md` - contracte del highlight
- `docs/14-session-management.md` - `sessionId` i reconnexió

## Roadmap

- `docs/09-future-improvements.md` - només pendents reals
- `docs/19-state-variants-preparation.md` - base preparatòria per variants d'estat futures
- `docs/20-postmessage-migration-plan.md` - resum curt del canvi de transport cap a `postMessage`

## Notes sobre documents antics o resumits

Alguns fitxers numerats antics es mantenen només com a punters curts per no trencar referències internes. Si un document remet a un altre, el document de destí és el canònic.
