import { notFound } from "next/navigation";
import { CustomerProcurementDashboard } from "@/components/customer/CustomerProcurementDashboard";
import { isSupportedLocale } from "@/types";

export default async function PurchaseOrdersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  return <CustomerProcurementDashboard lang={lang} initialView="purchase_orders" />;
}
