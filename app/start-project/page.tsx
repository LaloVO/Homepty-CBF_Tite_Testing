import { redirect } from "next/navigation";

export default async function StartProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; reference?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference ?? params.template;
  redirect(reference
    ? `https://app.homepty.com/my-site?reference=${encodeURIComponent(reference)}`
    : "https://app.homepty.com/my-site");
}
