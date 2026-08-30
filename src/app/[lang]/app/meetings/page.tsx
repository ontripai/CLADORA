import {notFound} from 'next/navigation';
import {isSupportedLocale} from '@/types';
import {CustomerGovernanceDashboard} from '@/components/customer/CustomerGovernanceDashboard';
export default async function MeetingsPage({params}:{params:Promise<{lang:string}>}){const{lang}=await params;if(!isSupportedLocale(lang))notFound();return <CustomerGovernanceDashboard lang={lang} initialView="agenda"/>}
