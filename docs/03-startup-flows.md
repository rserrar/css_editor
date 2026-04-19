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
2. l'editor obre automàticament la preview en una finestra nova
3. es fa el handshake inicial
4. la web respon amb el seu context
5. l'editor valida la connexió
6. l'editor crea el projecte nou
7. comença l'edició

### A2. Obrir projecte existent

1. l'usuari puja el fitxer JSON
2. l'editor valida l'esquema del fitxer
3. l'editor mostra un resum del projecte o permet restaurar draft si escau
4. si el projecte té `baseUrl`, l'editor pot obrir la web associada automàticament
5. si hi ha connexió, es valida compatibilitat
6. l'editor carrega la configuració i comença l'edició

## Flux B: restaurar sessió o projecte existent

La pantalla inicial també pot partir d'una sessió prèvia guardada.

### B1. Restaurar draft

1. l'editor detecta un draft a `localStorage`
2. ofereix restaurar-lo o descartar-lo
3. si es restaura, recupera projecte i configuració
4. l'usuari pot reobrir la preview amb la `baseUrl` associada si cal

### B2. Carregar projecte existent

1. l'usuari puja el fitxer JSON
2. l'editor valida compatibilitat i format
3. si el projecte té `baseUrl`, l'editor pot obrir la preview automàticament
4. si no hi ha connexió, l'edició local continua sent possible

## Estat final comú

Independentment del punt d'entrada, el sistema ha de convergir a un mateix estat:

- un projecte carregat o creat
- una configuració disponible
- una sessió de comunicació activa o pendent
- un context de web conegut o absent
