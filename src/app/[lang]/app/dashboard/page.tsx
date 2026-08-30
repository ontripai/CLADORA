import {notFound} from 'next/navigation';
import {CustomerDashboard} from '@/components/customer/CustomerDashboard';
import {isSupportedLocale} from '@/types';
export default async function DashboardPage({params}:{params:Promise<{lang:string}>}){const{lang}=await params;if(!isSupportedLocale(lang))notFound();return <CustomerDashboard lang={lang}/>}
