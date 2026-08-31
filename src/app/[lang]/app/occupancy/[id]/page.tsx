import type { Language } from "@/types";
import { CustomerOccupancyDashboard } from "@/components/customer/CustomerOccupancyDashboard";
export default async function OccupancyDetailsPage({params}:{params:Promise<{lang:Language;id:string}>}){const{lang,id}=await params;return <CustomerOccupancyDashboard lang={lang} initialId={id}/>;}
