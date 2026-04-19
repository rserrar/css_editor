# CSS Visual Editor Boilerplate

Boilerplate i documentació d'un sistema d'edició visual d'estils segur, desacoblat i multi-projecte.

## Què inclou

- Editor separat, pensat per React + TypeScript
- Mòdul lleuger per instal·lar a la web a editar
- Comunicació local via `BroadcastChannel`
- Protocol de missatges compartit
- Sistema d'estils segur basat en `data-editable`
- Model multi-projecte amb importació i exportació de JSON

## Documentació

La documentació principal és a `/docs`.

Ordre recomanat de lectura:

1. `01-overview.md`
2. `02-architecture.md`
3. `03-startup-flows.md`
4. `04-editor.md`
5. `05-preview.md`
6. `06-communication.md`
7. `07-data-format.md`
8. `08-editor-frontend-structure.md`
9. `09-preview-module-structure.md`

## Principis del projecte

- No hi ha CSS lliure
- El JSON és la font de veritat
- La web no crea projectes; només exposa context i aplica estils
- L'editor és qui crea, carrega, valida, exporta i gestiona projectes
- La comunicació ha de ser intercanviable
