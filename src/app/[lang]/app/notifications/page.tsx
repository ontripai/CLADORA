import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/types";
import { CustomerCommunicationsDashboard } from "@/components/customer/CustomerCommunicationsDashboard";
export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  return (
    <CustomerCommunicationsDashboard lang={lang} initialView="notifications" />
  );
}
