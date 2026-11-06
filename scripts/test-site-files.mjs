import assert from "node:assert/strict";
import test from "node:test";

import {
  apuntaARutaDeSitio,
  esRutaDelSitio,
  guardarReferenciasDelLead,
  leerDocumentosDelLead,
  leerPedidoDeSubida,
  nombreSeguro,
  referenciaDelArchivo,
  referenciasDeDocumentos,
  rutaNueva,
} from "../lib/site-files.ts";

/*
 * Por qué importa (owner, 2026-10-16): los sitios ya no tienen llaves de Supabase; CBF decide dónde
 * se guarda cada archivo y sólo registra lo que él autorizó. Si un sitio pudiera elegir la ruta,
 * registrar un archivo de otro sitio o subir cualquier tipo de archivo, el token público del sitio
 * bastaría para leer o plantar expedientes ajenos (INE, escrituras). Estas pruebas fallan si eso
 * vuelve a ser posible.
 */

const SITIO = "52a40ed8-afe3-4a9a-976c-735d2ae93406";
const OTRO_SITIO = "e82ed8fb-0000-4000-8000-000000000000";
const UUID = "0f8fad5b-d9cb-469f-a165-70867728950e";

test("la ruta la arma CBF: carpeta del sitio, uuid propio y nombre sin carpetas", () => {
  assert.equal(rutaNueva(SITIO, "INE frente.pdf", UUID), `sitios/${SITIO}/${UUID}/INE_frente.pdf`);
  assert.equal(nombreSeguro("../../otro-sitio/escritura.pdf"), "escritura.pdf", "un nombre con carpetas no sale de su ruta");
  assert.equal(nombreSeguro("..pdf"), "pdf", "sin puntos iniciales");
  assert.equal(nombreSeguro("???"), "_", "caracteres raros se vuelven _");
  assert.equal(nombreSeguro(""), "archivo");
  const largo = nombreSeguro(`${"a".repeat(300)}.pdf`);
  assert.equal(largo.length, 120);
  assert.ok(largo.endsWith(".pdf"), "al recortar se conserva la extensión");
  assert.throws(() => rutaNueva("no-es-uuid", "a.pdf", UUID), "el sitio tiene que ser un id válido");
});

test("sólo vale una ruta emitida para ESTE sitio", () => {
  const ruta = rutaNueva(SITIO, "escritura.pdf", UUID);
  assert.equal(esRutaDelSitio(ruta, SITIO), true);
  assert.equal(esRutaDelSitio(ruta, OTRO_SITIO), false, "otro sitio no puede registrar el archivo como suyo");
  for (const ajena of [
    `sitios/${SITIO}/${UUID}/../x.pdf`,
    `sitios/${SITIO}/${UUID}/a/b.pdf`,
    `sitios/${SITIO}/no-uuid/b.pdf`,
    `leads/correo/identificacion/1_a.pdf`,
    `/sitios/${SITIO}/${UUID}/a.pdf`,
    `sitios/${SITIO}/${UUID}/.oculto`,
    `https://x.supabase.co/storage/v1/object/public/documentos-leads/sitios/${SITIO}/${UUID}/a.pdf`,
    123,
    null,
  ]) {
    assert.equal(esRutaDelSitio(ajena, SITIO), false, `rechaza ${String(ajena)}`);
  }
});

test("cada propósito acepta sólo los tipos de su formulario", () => {
  const lead = leerPedidoDeSubida({ purpose: "lead_document", file_name: "ine.pdf", content_type: "application/pdf" });
  assert.deepEqual(lead, { ok: true, proposito: "lead_document", bucket: "documentos-leads", nombre: "ine.pdf", tipo: "application/pdf" });
  assert.equal(leerPedidoDeSubida({ purpose: "seller_document", file_name: "escritura.docx", content_type: "" }).tipo,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "sin tipo del navegador se toma de la extensión");
  assert.equal(leerPedidoDeSubida({ purpose: "seller_image", file_name: "sala.HEIC", content_type: "application/octet-stream" }).tipo, "image/heic");
  assert.equal(leerPedidoDeSubida({ purpose: "seller_image", file_name: "sala.jpg", content_type: "image/jpeg" }).bucket, "seller-inquiry-images");

  for (const [pedido, status] of [
    [{ purpose: "lead_document", file_name: "pagina.html", content_type: "text/html" }, 415],
    [{ purpose: "seller_image", file_name: "logo.svg", content_type: "image/svg+xml" }, 415],
    [{ purpose: "lead_document", file_name: "escritura.docx", content_type: "" }, 415],
    [{ purpose: "lead_document", file_name: "script.pdf", content_type: "text/html" }, 415],
    [{ purpose: "otra-cosa", file_name: "a.pdf", content_type: "application/pdf" }, 400],
    [{ purpose: "constructor", file_name: "a.pdf", content_type: "application/pdf" }, 400],
    [{ purpose: "lead_document", file_name: "", content_type: "application/pdf" }, 400],
    [null, 400],
  ]) {
    const r = leerPedidoDeSubida(pedido);
    assert.equal(r.ok, false, JSON.stringify(pedido));
    assert.equal(r.status, status, JSON.stringify(pedido));
  }
});

test("la referencia guardada apunta al objeto con la forma que ya lee la Suite", () => {
  const ruta = rutaNueva(SITIO, "ine.pdf", UUID);
  assert.equal(referenciaDelArchivo("https://ref.supabase.co/", "documentos-leads", ruta),
    `https://ref.supabase.co/storage/v1/object/public/documentos-leads/${ruta}`);
});

test("documentos del lead: { documento: ruta } con rutas de este sitio; ausente = sin archivos", () => {
  const ruta = rutaNueva(SITIO, "ine.pdf", UUID);
  assert.deepEqual(leerDocumentosDelLead({ identificacion: ruta }, SITIO), { ok: true, documentos: [{ clave: "identificacion", ruta }] });
  assert.deepEqual(leerDocumentosDelLead(undefined, SITIO), { ok: true, documentos: [] });
  assert.equal(leerDocumentosDelLead({ identificacion: ruta }, OTRO_SITIO).ok, false);
  assert.equal(leerDocumentosDelLead({ identificacion: "https://cualquier.host/ine.pdf" }, SITIO).ok, false,
    "una URL arbitraria no entra como documento subido con permiso de CBF");
  assert.equal(leerDocumentosDelLead({ "Identificación!": ruta }, SITIO).ok, false);
  assert.equal(leerDocumentosDelLead([ruta], SITIO).ok, false);
});

test("por documentos_urls (sitios anteriores) no se cuela un archivo emitido por CBF para otro sitio", () => {
  const proyecto = "https://ref.supabase.co";
  const ajena = referenciaDelArchivo(proyecto, "documentos-leads", rutaNueva(OTRO_SITIO, "ine.pdf", UUID));
  assert.equal(apuntaARutaDeSitio(ajena, proyecto), true);
  assert.equal(apuntaARutaDeSitio(ajena.replace("/public/", "/authenticated/"), proyecto), true);
  assert.equal(apuntaARutaDeSitio(`${proyecto}/storage/v1/object/public/documentos-leads/leads/ana/identificacion/1_ine.pdf`, proyecto), false,
    "las URLs que suben los sitios anteriores siguen entrando como antes");
  assert.equal(apuntaARutaDeSitio("https://homepty-prod-documentos-leads.s3.us-east-1.amazonaws.com/leads/a.pdf", proyecto), false);
  assert.equal(apuntaARutaDeSitio(42, proyecto), false);
});

/*
 * HPY-216 (estatuto de borrado de la Suite, enmienda del 2026-11-06). Por qué importa: los documentos que un lead manda por un sitio
 * (su INE, sus comprobantes) sólo quedaban como enlaces en el texto de la solicitud, que el estatuto no vuelve a leer: el día 90 del
 * asesor la solicitud se iba y los archivos se quedaban para siempre. Ahora CBF guarda una referencia por documento en una tabla que
 * sólo escribe el servidor, y el estatuto la extrae del día 30 al 90 y la purga el día 90. Si una de estas pruebas falla, un documento
 * de este sitio se queda fuera del estatuto, o la referencia de un sitio nombra un archivo de otro (y el estatuto lo leería o lo
 * borraría porque este sitio lo mandó).
 */

test("referencias: sólo los archivos que CBF dejó subir a ESTE sitio, con la URL que lee la Suite", () => {
  const proyecto = "https://ref.supabase.co";
  const ine = rutaNueva(SITIO, "INE frente.pdf", UUID);
  assert.deepEqual(referenciasDeDocumentos(proyecto, SITIO, [{ clave: "identificacion", ruta: ine }]), [{
    site_id: SITIO,
    tipo_documento: "identificacion",
    file_url: `${proyecto}/storage/v1/object/public/documentos-leads/sitios/${SITIO}/${UUID}/INE_frente.pdf`,
  }], "el sitio del token, la casilla y el objeto en documentos-leads");
  assert.deepEqual(referenciasDeDocumentos(proyecto, SITIO, [{ clave: "identificacion", ruta: rutaNueva(OTRO_SITIO, "ine.pdf", UUID) }]), [],
    "el archivo de otro sitio nunca queda como de este");
  for (const ruta of [
    "leads/ana_x_mx/identificacion/1730000000000_ine.pdf", // lo que los sitios de antes suben con la llave pública
    `${proyecto}/storage/v1/object/public/documentos-leads/leads/ana_x_mx/identificacion/1_ine.pdf`,
    `${proyecto}/storage/v1/object/public/documentos-leads/sitios/${SITIO}/${UUID}/ine.pdf`, // una URL no es una ruta emitida
    `sitios/${SITIO}/${UUID}/../ine.pdf`,
  ]) {
    assert.deepEqual(referenciasDeDocumentos(proyecto, SITIO, [{ clave: "identificacion", ruta }]), [], `no se ata al sitio: ${ruta}`);
  }
  assert.deepEqual(referenciasDeDocumentos(proyecto, SITIO, []), [], "sin documentos, sin referencias");
});

test("referencias: se guardan con su solicitud; si no se pueden guardar, la solicitud se deshace y el sitio la vuelve a mandar", async () => {
  const proyecto = "https://ref.supabase.co";
  const referencias = referenciasDeDocumentos(proyecto, SITIO, [
    { clave: "identificacion", ruta: rutaNueva(SITIO, "ine.pdf", UUID) },
    { clave: "comprobante_ingresos", ruta: rutaNueva(SITIO, "nomina.png", "1f8fad5b-d9cb-469f-a165-70867728950e") },
  ]);
  const baseFalsa = (errorAlInsertar = null, errorAlBorrar = null) => {
    const llamadas = [];
    return {
      llamadas,
      insertarReferencias: async (filas) => { llamadas.push(["insertar", filas]); return { error: errorAlInsertar }; },
      borrarSolicitud: async (id) => { llamadas.push(["borrar", id]); return { error: errorAlBorrar }; },
    };
  };
  const errores = [];
  const consola = console.error;
  console.error = (...args) => errores.push(args.map(String).join(" "));
  try {
    const bien = baseFalsa();
    assert.deepEqual(await guardarReferenciasDelLead(41, referencias, bien), { ok: true });
    assert.deepEqual(bien.llamadas, [["insertar", referencias.map((r) => ({ solicitud_id: 41, ...r }))]], "cada referencia, con su solicitud");

    const sinDocumentos = baseFalsa();
    assert.deepEqual(await guardarReferenciasDelLead(42, [], sinDocumentos), { ok: true });
    assert.deepEqual(sinDocumentos.llamadas, [], "una solicitud sin documentos no escribe nada más");

    const falla = baseFalsa({ code: "42P01" });
    const r = await guardarReferenciasDelLead(43, referencias, falla);
    assert.equal(r.ok, false);
    assert.deepEqual(falla.llamadas.map(([que, valor]) => que === "borrar" ? [que, valor] : [que]), [["insertar"], ["borrar", 43]],
      "nunca queda una solicitud con documentos fuera del estatuto");

    const fallaTodo = baseFalsa({ code: "57014" }, { code: "57014" });
    assert.equal((await guardarReferenciasDelLead(44, referencias, fallaTodo)).ok, false, "aunque deshacerla falle, el sitio recibe el error");
  } finally {
    console.error = consola;
  }
  assert.ok(errores.length >= 3 && errores.every((e) => !e.includes("storage/") && !e.includes("sitios/")), "los logs sólo llevan códigos");
});
