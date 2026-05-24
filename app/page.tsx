import { headers } from 'next/headers';
import { getSiteByDomain } from '../lib/db';
import { supabase, type User } from '../lib/supabase';
import { PageRenderer } from './components/PageRenderer';
import Header from './components/homepty/Header';
import HeroSection from './components/homepty/HeroSection';
import ClientsCarousel from './components/homepty/ClientsCarousel';
import DashboardPreviewSection from './components/homepty/DashboardPreviewSection';
import FeaturesSection from './components/homepty/FeaturesSection';
import WhiteLabelSection from './components/homepty/WhiteLabelSection';
import Nom247Section from './components/homepty/Nom247Section';
import PricingSection from './components/homepty/PricingSection';
import CTASection from './components/homepty/CTASection';
import Footer from './components/homepty/Footer';

const HOMEPTY_MAIN_DOMAINS = ['localhost', 'homepty.com', 'www.homepty.com', 'sites.homepty.com'];

type UserSlice = Pick<User, 'id' | 'email_usuario' | 'nombre_usuario'>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ usuario?: string }>;
}) {
  const [headersList, params] = await Promise.all([headers(), searchParams]);
  const rawHost = headersList.get('host') || '';
  const domain = rawHost.replace('www.', '').replace(/:\d+$/, '');

  let user: UserSlice | null = null;
  if (params.usuario) {
    const { data } = await supabase
      .from('usuarios')
      .select('id, email_usuario, nombre_usuario')
      .eq('id', params.usuario)
      .single();
    user = data ?? null;
  }

  if (HOMEPTY_MAIN_DOMAINS.includes(domain) || domain === '') {
    return (
      <div className="min-h-screen">
        <Header user={user} />
        <main>
          <HeroSection user={user} />
          <ClientsCarousel />
          <DashboardPreviewSection />
          <FeaturesSection />
          <WhiteLabelSection />
          <PricingSection user={user} />
          <Nom247Section />
          <CTASection />
        </main>
        <Footer />
      </div>
    );
  }

  const site = await getSiteByDomain(domain);

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sitio no encontrado
          </h1>
          <p className="text-gray-600 mb-6">
            El dominio <strong>{domain}</strong> no está configurado en Homepty.
          </p>
          <a
            href="https://app.homepty.com/my-site"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Configurar mi sitio
          </a>
        </div>
      </div>
    );
  }

  const page = site.config.pages.find((p: any) => p.route === '/');

  if (!page) {
    return <div className="p-10">Página de inicio no configurada</div>;
  }

  return (
    <div
      className="bg-background font-sans text-foreground overflow-x-hidden"
      style={{ fontFamily: site.config.theme.font_family }}
    >
      <PageRenderer
        page={page}
        userId={site.userId}
        siteConfig={site.config}
      />
    </div>
  );
}
