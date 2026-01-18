import { headers } from 'next/headers';
import { getSiteByDomain } from '../lib/db';
import { PageRenderer } from './components/PageRenderer';

export default async function HomePage() {
  const headersList = await headers();
  const rawHost = headersList.get('host') || '';

  let domain = rawHost.replace('www.', '').replace(':3000', '');

  if (domain === 'localhost') {
    domain = 'testingidea.shop';
  }

  const site = await getSiteByDomain(domain);

  const page = site.config.pages.find((p: any) => p.route === '/');

  if (!page) {
    return <div className="p-10">Home no configurado</div>;
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
      <PageRenderer page={page} />
    </div>
  );
}
