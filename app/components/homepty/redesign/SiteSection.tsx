import SiteStory from "./SiteStory";

export default function SiteSection() {
  return (
    <section className="section soft site-showcase" id="capabilities">
      <div className="section-inner site-intro">
        <h2 className="section-title reveal">
          {"No cinco landing pages. "}
          <span className="blue">
            {"Un mismo producto público que cambia de intención."}
          </span>
        </h2>
        <div className="section-kicker reveal">
          {"La appweb que ve tu cliente"}
        </div>
        <p className="section-lead reveal">
          {
            "Comprar, explorar, vender, solicitar y estimar viven bajo la misma identidad, navegación y capa de datos. El scroll recorre esos estados como una sola experiencia."
          }
        </p>
      </div>
      <SiteStory />
    </section>
  );
}
