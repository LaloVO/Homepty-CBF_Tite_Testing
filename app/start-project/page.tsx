import type { Metadata } from "next";
import { getTemplates } from "@/lib/templates";
import StartProjectForm from "./StartProjectForm";

export const metadata: Metadata = {
  title: "Inicia tu proyecto | Homepty Sites",
  description:
    "Cuéntanos tu visión. Construimos tu sitio inmobiliario en tiempo récord.",
};

interface Props {
  searchParams: Promise<{ template?: string }>;
}

export default async function StartProjectPage({ searchParams }: Props) {
  const { template } = await searchParams;
  const templates = getTemplates();
  const initialTemplate = template ?? templates[0]?.slug ?? "";

  return (
    <StartProjectForm initialTemplate={initialTemplate} templates={templates} />
  );
}
