# Estat de l'editor

## Separació recomanada

L'estat s'ha de separar entre:

- estat de domini
- estat de UI

## Estat de domini

Inclou la informació persistent o de negoci.

Exemples:

- projecte actual
- configuració d'estils
- informació de la preview
- estat de connexió
- compatibilitat detectada

## Estat de UI

Inclou informació temporal de presentació.

Exemples:

- target seleccionat
- panell actiu
- modal oberta
- errors temporals
- loading

## Regles

- la configuració és la font de veritat dels estils
- qualsevol canvi de propietat actualitza la configuració
- cada canvi pot derivar en un missatge `style:update`
- l'exportació sempre es construeix a partir del projecte i la configuració actuals
