import {notFound} from 'next/navigation';
import {isSupportedLocale} from '@/types';
import {CustomerBillingDashboard} from '@/components/customer/CustomerBillingDashboard';
export default async function BillingPage({params}:{params:Promise<{lang:string}>}){const{lang}=await params;if(!isSupportedLocale(lang))notFound();return <CustomerBillingDashboard lang={lang}/>}
