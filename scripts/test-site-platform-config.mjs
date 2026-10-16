import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { sitePlatformConfig } from "../lib/site-platform-config.ts";

/*
 * Por qué importa: los sitios CBF ya no traen llaves embebidas en su código. La plantilla avisaba
 * «La captación de propiedades aún no está configurada para este sitio» porque no tenía la URL ni la
 * llave anon de Supabase. CBF se las entrega en `/user`, igual que el token de Mapbox. Lo que nunca
 * puede viajar al navegador es la llave de servicio, que salta la RLS.
 */

const ENV = {
  MAPBOX_ACCESS_TOKEN: "pk.mapbox-publico-de-prueba",
  NEXT_PUBLIC_SUPABASE_URL: "https://proyecto-de-prueba.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-publica-de-prueba",
  SUPABASE_SERVICE_ROLE_KEY: "servicio-que-salta-la-rls",
  STRIPE_SECRET_KEY: "sk-de-prueba",
  CBF_ADMIN_API_KEY: "admin-de-prueba",
};

test("el sitio recibe la configuración pública que necesita para captar y subir documentos", () => {
  assert.deepEqual(sitePlatformConfig(ENV), {
    mapbox_token: "pk.mapbox-publico-de-prueba",
    supabase_url: "https://proyecto-de-prueba.supabase.co",
    supabase_anon_key: "anon-publica-de-prueba",
  });
});

test("ninguna llave privada llega al sitio", () => {
  const json = JSON.stringify(sitePlatformConfig(ENV));
  for (const secret of [ENV.SUPABASE_SERVICE_ROLE_KEY, ENV.STRIPE_SECRET_KEY, ENV.CBF_ADMIN_API_KEY]) {
    assert.equal(json.includes(secret), false, secret);
  }
});

test("sin configuración el sitio recibe null y lo dice; CBF no inventa valores", () => {
  assert.deepEqual(sitePlatformConfig({}), { mapbox_token: null, supabase_url: null, supabase_anon_key: null });
});

test("/user arma platform_config sólo con el helper: nadie agrega una variable a mano", () => {
  const userRoute = readFileSync(new URL("../app/api/cbf/user/route.ts", import.meta.url), "utf8");
  assert.equal(userRoute.includes("platform_config: sitePlatformConfig()"), true);
  assert.equal(userRoute.includes("process.env"), false);
});
