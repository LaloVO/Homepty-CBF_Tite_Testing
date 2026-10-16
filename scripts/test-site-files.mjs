import assert from "node:assert/strict";
import test from "node:test";

import {
  apuntaARutaDeSitio,
  esRutaDelSitio,
  leerDocumentosDelLead,
  leerPedidoDeSubida,
  nombreSeguro,
  referenciaDelArchivo,
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
