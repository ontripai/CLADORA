import type { Language } from "@/types";
import { CustomerDocumentsDashboard } from "@/components/customer/CustomerDocumentsDashboard";
export default async function DocumentsPage({ params }: { params: Promise<{ lang: Language }> }) {
  const { lang } = await params;
  return <CustomerDocumentsDashboard lang={lang} />;
}
