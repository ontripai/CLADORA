import type { Language } from "@/types";
import { CustomerOccupancyDashboard } from "@/components/customer/CustomerOccupancyDashboard";
export default async function OccupancyPage({params}:{params:Promise<{lang:Language}>}){const{lang}=await params;return <CustomerOccupancyDashboard lang={lang}/>;}
