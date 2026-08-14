import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

type OfferRow = {
  plan_id: "asesor" | "agencia";
  price_mxn_cents: number;
  plans: { nombre: string; price_mxn_cents: number | null; limits: Record<string, number | null> } | null;
};

function money(cents: number | null) {
  if (cents == null) return "Contrato personalizado";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(cents / 100);
}
export default async function PricingSection() {
  const { data } = await supabase
    .from("site_setup_offers")
    .select("plan_id, price_mxn_cents, plans(nombre, price_mxn_cents, limits)")
    .eq("is_active", true)
    .in("plan_id", ["asesor", "agencia"])
    .order("price_mxn_cents", { ascending: true });
  const offers = (data ?? []) as unknown as OfferRow[];

  return (
    <section id="pricing" className="bg-gradient-to-b from-background to-accent/20 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-4xl font-bold text-foreground md:text-5xl">Un plan Homepty, un sitio hecho para tu marca</h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">El pago y los upgrades se gestionan en Homepty. Aquí no vendemos plantillas ni creamos sitios antes de confirmar la orden.</p>
        </div>

        {offers.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {offers.map((offer) => {
              const agency = offer.plan_id === "agencia";
              const monthly = offer.plans?.price_mxn_cents ?? null;
              return (
                <Card key={offer.plan_id} className="flex h-full flex-col border-border bg-card/80 shadow-sm">
                  <CardHeader>
                    <h3 className="text-2xl font-bold text-foreground">{offer.plans?.nombre ?? offer.plan_id}</h3>
                    <p className="mt-2 text-muted-foreground">{agency ? "Presencia de organización con inventario autorizado." : "Presencia profesional ligada a tu inventario personal."}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <div className="grid grid-cols-2 gap-4 border-y border-border py-5">
                      <div>
                        <p className="text-sm text-muted-foreground">Setup único</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{money(offer.price_mxn_cents)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Plan mensual</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{money(monthly)}</p>
                      </div>
                    </div>
                    <ul className="my-6 flex-1 space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Sitio nuevo diseñado desde cero</li>
                      <li className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Product Shell inmobiliario conectado a CBF</li>
                      <li className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Un sitio por cuenta con lifecycle reversible</li>
                    </ul>
                    <Button size="lg" asChild>
                      <a href="https://app.homepty.com/my-site">Contratar desde Homepty</a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">El catálogo se está sincronizando. Puedes continuar de forma segura en Homepty.</p>
            <Button className="mt-5" asChild><a href="https://app.homepty.com/my-site">Abrir Mi Sitio</a></Button>
          </div>
        )}
      </div>
    </section>
  );
}
