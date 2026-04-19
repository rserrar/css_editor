# Fluxos d'inici

## Dues decisions, quatre casos

El sistema té dues decisions inicials:

1. des d'on s'inicia
2. què es vol fer

### Des d'on s'inicia

- des de l'editor
- des de la web

### Què es vol fer

- crear projecte nou
- obrir projecte existent

Això dona quatre casos, però el model mental recomanat són dues decisions successives.

## Flux A: inici des de l'editor

Pantalla inicial:

- Crear projecte nou
- Obrir projecte existent

### A1. Crear projecte nou

1. l'usuari introdueix la URL de la web
2. l'editor obre o connecta la preview
3. es fa el handshake inicial
4. la web respon amb el seu context
5. l'editor valida la connexió
6. l'editor crea el projecte nou
7. comença l'edició

### A2. Obrir projecte existent

1. l'usuari puja el fitxer JSON
2. l'editor valida l'esquema del fitxer
3. l'editor mostra un resum del projecte
4. l'usuari pot connectar-se a la web associada o continuar sense connexió
5. si hi ha connexió, es valida compatibilitat
6. l'editor carrega la configuració i comença l'edició

## Flux B: inici des de la web

La web obre l'editor i li passa el `sessionId`.

Pantalla inicial de l'editor:

- Crear projecte nou per aquesta web
- Carregar projecte existent

### B1. Crear projecte nou

1. l'editor demana informació inicial a la web
2. rep la URL, `siteKey` i `targets`
3. crea un nou projecte amb aquestes dades
4. comença l'edició

### B2. Carregar projecte existent

1. l'editor demana informació inicial a la web
2. l'usuari puja el fitxer JSON
3. l'editor valida compatibilitat entre JSON i web
4. si és compatible, aplica la configuració
5. si no és compatible, mostra un avís i permet cancel·lar o continuar sense connexió

## Estat final comú

Independentment del punt d'entrada, el sistema ha de convergir a un mateix estat:

- un projecte carregat o creat
- una configuració disponible
- una sessió de comunicació activa o pendent
- un context de web conegut o absent
