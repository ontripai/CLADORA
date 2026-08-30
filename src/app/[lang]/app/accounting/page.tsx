import {notFound} from 'next/navigation';
import {isSupportedLocale} from '@/types';
import {CustomerAccountingLedger} from '@/components/customer/CustomerAccountingLedger';
export default async function AccountingPage({params}:{params:Promise<{lang:string}>}){const{lang}=await params;if(!isSupportedLocale(lang))notFound();return <CustomerAccountingLedger lang={lang}/>}
