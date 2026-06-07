import { Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer id="footer" className="py-12 px-6 bg-foreground text-background">
      <div className="w-full md:px-4 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="text-2xl font-bold mb-4">Homepty</h3>
            <p className="text-background/70 leading-relaxed">
              Transformando el sector inmobiliario con tecnología de punta,
              inteligencia artificial y datos predictivos.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Links</h4>
            <ul className="space-y-3 text-background/70">
              <li>
                <a href="#pricing" className="hover:text-background transition-colors">
                  Planes
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Términos y condiciones
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Política de privacidad
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-background/70">
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5" />
                <a href="mailto:hola@homepty.com" className="hover:text-background transition-colors">
                  hola@homepty.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5" />
                <span>México</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-background/10 text-center text-background/50 text-sm">
          <p>&copy; {new Date().getFullYear()} Homepty. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
