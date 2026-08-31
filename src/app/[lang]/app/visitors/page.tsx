import { CustomerSecurityAccessDashboard } from "@/components/customer/CustomerSecurityAccessDashboard";
import type { Language } from "@/types";
export default async function VisitorsPage({params}:{params:Promise<{lang:Language}>}){const{lang}=await params;return <CustomerSecurityAccessDashboard lang={lang} initialView="visitors"/>;}
