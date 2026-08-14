import { redirect } from "next/navigation";

export default async function DemoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/plantillas/${encodeURIComponent(slug)}`);
}
