// Promoción de noviembre 2026 (anuncio_sites-noviembre_mitad-de-precio_20261115).
// Vence al terminar el martes 17 de noviembre en Ciudad de México (UTC-6, sin horario de verano).
const PROMO_ENDS_AT = Date.parse("2026-11-18T00:00:00-06:00");

function isPromoActive() {
  return Date.now() < PROMO_ENDS_AT;
}

export default function PromoOffer() {
  if (!isPromoActive()) return null;

  return (
    <div className="promo-offer" aria-label="Promoción de noviembre">
      <p className="promo-deadline">{"Hasta el martes 17 de noviembre"}</p>
      <p className="promo-from">
        {"De "}
        <s aria-label="antes 1,699 pesos">{"$1,699"}</s>
        {" a"}
      </p>
      <p className="promo-price">
        {"$849"}
        <span>{"MXN"}</span>
      </p>
      <p className="promo-terms">{"50% de descuento y el primer mes gratis"}</p>
      <div className="promo-footer">
        <a href="https://app.homepty.com/" className="btn-primary promo-cta">
          {"Solicita la tuya "}
          <svg
            className="btn-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </a>
        <small>{"IVA incluido"}</small>
      </div>
    </div>
  );
}
