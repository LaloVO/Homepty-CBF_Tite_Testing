import SiteStory from "./SiteStory";

export default function SiteSection() {
  return (
    <section className="section soft site-showcase" id="capabilities">
      <div className="section-inner site-intro">
        <h2 className="section-title reveal">
          {"La diferencia no está en cómo se ve una propiedad. "}
          <span className="blue">
            {"Está en lo que el sitio puede hacer."}
          </span>
        </h2>
        <div className="section-kicker reveal">
          {"La appweb que ve tu cliente"}
        </div>
        <p className="section-lead reveal">
          {
            "La interfaz pública y la operación privada comparten una misma lógica: buscar, entender, atender y convertir sin saltar entre micrositios desconectados."
          }
        </p>
      </div>
      <SiteStory />
    </section>
  );
}
