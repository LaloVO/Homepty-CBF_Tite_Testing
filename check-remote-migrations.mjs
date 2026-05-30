import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nxouqoyppkiqrhfzovny.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54b3Vxb3lwcGtpcXJoZnpvdm55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwNDE4MywiZXhwIjoyMDk0MjgwMTgzfQ.GLDfLNEJQo4XTlK3VW5hTfW7xFkCjRlq2Unl3St26y4";

// Inicializamos el cliente con el esquema supabase_migrations
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "supabase_migrations" }
});

async function main() {
  console.log("🔍 Consultando la tabla schema_migrations de Supabase...");
  const { data, error } = await supabase
    .from("schema_migrations")
    .select("version")
    .order("version", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener schema_migrations:", error.message);
    return;
  }

  console.log("✅ Versiones registradas en la base de datos remota:");
  const versions = data.map(r => r.version);
  console.log(versions);
}

main();
