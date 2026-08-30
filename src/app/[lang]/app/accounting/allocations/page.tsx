import {notFound} from 'next/navigation';
import {isSupportedLocale} from '@/types';
import {CustomerAllocationDashboard} from '@/components/customer/CustomerAllocationDashboard';

export default async function AllocationsPage({params}:{params:Promise<{lang:string}>}){
  const{lang}=await params;if(!isSupportedLocale(lang))notFound();return <CustomerAllocationDashboard lang={lang}/>;
}
