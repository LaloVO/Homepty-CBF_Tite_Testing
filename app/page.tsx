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
    <div className="bg-background-light dark:bg-background-dark font-display text-[#101618] dark:text-white overflow-x-hidden">
      <PageRenderer page={page} />
    </div>
  );
}
