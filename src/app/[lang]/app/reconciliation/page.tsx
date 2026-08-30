import {notFound} from 'next/navigation';
import {isSupportedLocale} from '@/types';
import {CustomerPaymentsDashboard} from '@/components/customer/CustomerPaymentsDashboard';
export default async function ReconciliationPage({params}:{params:Promise<{lang:string}>}){const{lang}=await params;if(!isSupportedLocale(lang))notFound();return <CustomerPaymentsDashboard lang={lang} initialView="reconciliation"/>}
