# Arquitectura general

## Visió global

El sistema es divideix en dues aplicacions desacoblades:

- editor
- web / preview

La comunicació entre les dues es fa per protocol de missatges i un transport substituïble.

## Responsabilitats per capa

| Capa | Responsabilitat |
|---|---|
| Editor | Crear, carregar, validar i editar projectes |
| Preview | Exposar context i aplicar configuració |
| Shared | Definir contractes comuns |
| Transport | Enviar i rebre missatges |

## Regla d'or

La web no crea projectes.

La web només:

- respon qui és
- informa de la seva URL i context
- informa dels `targets` editables
- aplica una configuració rebuda

L'editor és qui:

- crea projectes nous
- carrega projectes existents
- exporta i importa JSON
- valida compatibilitats
- controla la sessió d'edició

## Model conceptual

### Projecte

Identitat estable d'una web editable.

### Sessió

Context temporal de connexió entre editor i web.

### Configuració

Mapa d'estils segurs per `target`.

### Preview info

Informació que la web retorna durant el handshake inicial.

## Font de veritat

La font de veritat és sempre el JSON de projecte/configuració.

La preview no conserva una lògica de negoci pròpia: reconstrueix el CSS a partir d'aquesta configuració.
