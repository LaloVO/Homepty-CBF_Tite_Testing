import { headers } from 'next/headers';
import { getSiteByDomain } from '../lib/db';
import { PageRenderer } from './components/PageRenderer';
import SitesLanding from './components/homepty/redesign/SitesLanding';

const HOMEPTY_MAIN_DOMAINS = ['localhost', 'homepty.com', 'www.homepty.com', 'sites.homepty.com'];

export default async function HomePage() {
  const headersList = await headers();
  const rawHost = headersList.get('host') || '';
  const domain = rawHost.replace('www.', '').replace(/:\d+$/, '');

  if (HOMEPTY_MAIN_DOMAINS.includes(domain) || domain === '') {
    return <SitesLanding />;
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

  const page = site.config.pages.find((candidate) => candidate.route === '/');

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
