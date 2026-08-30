import type { Language } from "@/types";
import { CustomerDocumentsDashboard } from "@/components/customer/CustomerDocumentsDashboard";
export default async function DocumentDetailsPage({ params }: { params: Promise<{ lang: Language; id: string }> }) {
  const { lang, id } = await params;
  return <CustomerDocumentsDashboard lang={lang} initialDocumentId={id} />;
}
