import {notFound} from 'next/navigation';
import {isSupportedLocale} from '@/types';
import {CustomerMaintenanceDashboard} from '@/components/customer/CustomerMaintenanceDashboard';

export default async function MaintenancePage({params}:{params:Promise<{lang:string}>}){const{lang}=await params;if(!isSupportedLocale(lang))notFound();return <CustomerMaintenanceDashboard lang={lang} initialView="work_orders"/>}
