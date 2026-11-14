# Llaves de Supabase fuera del código (CBF)

Este repo es público. El 2026-11-13 se encontró escrita en `check-remote-migrations.mjs` (commit `81905bd`) la service_role heredada de
la Suite. La rotación de las llaves de la Suite y sus dos revisiones independientes están en el runbook de la Suite: `homepty_new`, rama
`fix/supabase-llaves-nuevas`, `harness/progress/evidence/supabase-llaves-nuevas-2026-11-13/RUNBOOK-ROTACION.md`. Aquí sólo va lo que
cambia en CBF. Ningún archivo trae un valor secreto: sólo nombres, tipos y huellas.

| Commit (rama `fix/supabase-llaves-nuevas`) | Qué |
| --- | --- |
| `d8c120f`, `6030595` | Sin `check-remote-migrations.mjs`; la guarda `scripts/check-no-supabase-keys.mjs` y el workflow `llaves-supabase.yml`; el middleware usa la publicable primero |
| `a179343` | Revisión 111 (SF13): la guarda ve el token personal `sbp_`, archivos grandes y cada commit del push o del pull request |
| `9330a64`, `c908e23` | Revisión sec2: SF-2 y SF-3 (abajo) |
| `1b80c36`, `8445bb6` | Re-revisión sec2b: SF-R5 y N9 (abajo) |

## Ronda de la revisión 2 (revision-sec2, 2026-11-14)

Fuente: la revisión independiente `revision-sec2` (copia en la memoria del agente, `revisiones/revision-sec2-2026-11-14.md`).
Bitácora: `/private/tmp/sec2-fix-llaves/NOTAS.md`. **Nada se empujó ni se desplegó**, y ningún workflow corrió en GitHub.

**La guarda `scripts/check-no-supabase-keys.mjs` es el mismo archivo en CBF, la Suite y Welcome**: sha256
`3d99a192535ad4b8edda19f6e422935f66644a4780828addb331295ea6fc9299`. Antes, la de CBF difería en dos líneas de su encabezado; ahora
lleva el de la Suite y Welcome. Un cambio a la guarda se copia igual a los tres (desde la re-revisión sec2b, `8f06b7ac…`: abajo).

| Ítem | Arreglo | Commit | Prueba (`scripts/test-supabase-keys.mjs`) |
| --- | --- | --- | --- |
| SF-2 | Ningún archivo se salta: se lee byte a byte (latin1) y cada línea se busca sin sus NUL. Así una llave ASCII se ve en UTF-8, UTF-16 (LE o BE, con o sin BOM), en un texto con NUL y en un binario. El rango pide `--text`. Un error de lectura detiene la guarda (CLI exit 2); sólo se salta un archivo borrado del árbol de trabajo (ENOENT) | `9330a64` | UTF-16 LE con BOM y BE sin BOM, texto con NUL y binario, en el árbol y agregados y quitados en un rango; EISDIR detiene y ENOENT se salta |
| SF-3 | Las pruebas de la guarda corren en CI. `llaves-supabase.yml` corre primero el guardia (árbol y rango, sin dependencias), después `pnpm install --frozen-lockfile` (las pruebas cargan el cliente del middleware con `typescript`) y `node --test scripts/test-supabase-keys.mjs`. Sigue con `contents: read` y sin secretos | `c908e23` | el workflow leído sin comentarios: guardia, después instalación, después pruebas; sólo lectura, sin `id-token` |

SF-4 no aplica a CBF: no despliega a ECS ni tiene esos pasos.

Por qué se quitan los NUL en vez de detectar el BOM, como proponía la revisión: cubre lo mismo y además UTF-16 sin BOM o big-endian, un
texto con NUL y un binario, con una sola regla que también sirve al rango (git da las líneas UTF-16 con sus NUL).

Verificación: la prueba de la guarda pasó de 11 a **15/15** (14 en el commit intermedio); `pnpm test:supabase-keys` 15/15 con el árbol
limpio, `pnpm test:site-runtime` 62/62 y `tsc --noEmit` 0. Mutaciones en una copia desechable: **9 de 9 muertas**. El workflow pasa el parseo YAML estricto, la revisión de forma y `bash -n` de cada `run:`. Su paso de la guardia, corrido con
bash contra la cabeza de `master` de GitHub (60305950), sale 0 en push, rama nueva y pull_request, y 1 con una llave de prueba agregada y
quitada. Scripts y salidas: carpeta `revision-sec2/` del runbook de la Suite.

Lo que no se verificó: ninguna corrida real en GitHub; en particular, que `pnpm/action-setup@v4` tome pnpm 10.30.3 de `packageManager` y
que `pnpm install --frozen-lockfile` pase en el runner. La guarda no distingue una llave revocada de una viva.

## Ronda de la re-revisión (revision-sec2b, 2026-11-14)

Fuente: la re-revisión independiente `revision-sec2b` (copia en la memoria del agente, `revisiones/revision-sec2b-2026-11-14.md`). Aprobó
SF-2 y SF-3 con nits y abrió SF-R5: la guarda no miraba el mensaje de un commit ni el nombre de un archivo, y en el árbol saltaba un enlace
simbólico colgante. En este repo público, GitHub tiene secret scanning y push protection, pero el mensaje y los nombres se publican igual
que el código. Bitácora: `/private/tmp/sec2-fix-llaves/NOTAS.md`, sección «Ronda FIX-SEC-B». **Nada se empujó ni se desplegó**, y ningún
workflow corrió en GitHub.

**La guarda `scripts/check-no-supabase-keys.mjs` sigue siendo el mismo archivo en CBF, la Suite y Welcome**, ahora con sha256
`8f06b7acb996bc694f42514531caebc08f2a9f2171d16c72ffe7ef511fd280ae`.

| Ítem | Arreglo | Commit | Prueba (`scripts/test-supabase-keys.mjs`) |
| --- | --- | --- | --- |
| SF-R5 | El rango revisa también el mensaje entero de cada commit, también el de una fusión, y el nombre y la ruta de cada archivo que queda en el commit, también uno vacío (no uno borrado). El árbol revisa el nombre y la ruta de cada archivo y el destino de cada enlace simbólico, leído con `readlink` y nunca seguido. Si un directorio de la ruta de un archivo versionado es un enlace, la guarda sale con 2. Una ruta con una llave sale tapada («llave») en el informe y en los errores, así que el log público de Actions tampoco la lleva | `1b80c36` | 4 casos: mensaje (asunto, cuerpo y fusión), nombre y ruta (archivo, directorio y archivo vacío, en el árbol y en el rango), enlaces (colgante, hacia fuera, hacia dentro, directorio enlazado) y un error ENOTDIR con la llave en la ruta. Con la guarda `3d99a192` fallan los 4 |
| N9 | `llaves-supabase.yml`: `persist-credentials: false` en el checkout (ni el guardia ni `pnpm install` usan el token: las 535 dependencias vienen del registro, ninguna de git), y cada acción fijada por el SHA del commit al que apuntaba `@v4` el 2026-11-14 (checkout v4.4.0 `11d5960a…`, pnpm/action-setup v4.3.0 `b906affc…`, setup-node v4.4.0 `49933ea5…`). El código que corre no cambia | `8445bb6` | exige `persist-credentials: false` y un SHA de 40 caracteres en cada `uses:`; con el workflow anterior fallan 2 |

**Lo que la guarda no ve** (N8): una llave partida en dos líneas, con `\` de shell o concatenada en JS; una dentro de un gzip, en base64,
con escapes `\u` de JSON o con un carácter de ancho cero; el mensaje de una etiqueta anotada y el autor o el committer de un commit; en el
árbol, un archivo cuyo nombre no es UTF-8 válido (sólo en Linux; el rango sí lo revisa). Falla cerrada (exit 2) con un force-push y con un
submódulo. El detalle y el porqué de cada decisión están en el §8 del runbook de la Suite.

Verificación: la prueba de la guarda pasó de 15 a **20/20**; `pnpm test:supabase-keys` 20/20 con el árbol limpio, `pnpm test:site-runtime`
62/62 y `tsc --noEmit` 0. Mutaciones en una copia desechable: **25 de 25 muertas**. El paso de la guardia, corrido con bash contra la cabeza
de `master` de GitHub (60305950), sale 0 en push, rama nueva y pull_request. Sale 1, sin imprimir el valor, con una llave de prueba en el
contenido, en el mensaje de un commit, en el nombre de un archivo vacío o como destino de un enlace. En todo el historial de las 19 ramas y
etiquetas (104 commits, 234 rutas) no hay un mensaje, un nombre ni un enlace que la guarda nueva rechace, y el rango de la integración
(`60305950..d5564bf1`, 15 commits) sale 0. Scripts y salidas: carpeta `revision-sec2b/` del runbook de la Suite.

Lo que no se verificó: ninguna corrida real en GitHub; es la prueba viva de los SHA fijados, de `persist-credentials: false` y de que
`pnpm/action-setup` fijado tome pnpm 10.30.3 de `packageManager`, como lo hacía `@v4`.
