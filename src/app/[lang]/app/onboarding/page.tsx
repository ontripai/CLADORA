import { redirect } from 'next/navigation';
import { AccountSecurityPanel } from '@/components/auth/AccountSecurityPanel';
import { OnboardingCompletionForm } from '@/components/auth/OnboardingCompletionForm';
import { isSupportedLocale } from '@/types';

export default async function OnboardingPage({ params, searchParams }: { params: Promise<{lang:string}>; searchParams: Promise<{workspace?:string;version?:string}> }) {
  const {lang}=await params; if(!isSupportedLocale(lang)) redirect('/ro/login');
  const query=await searchParams; const version=Number(query.version);
  if(!query.workspace || !/^[0-9a-f-]{36}$/i.test(query.workspace) || !Number.isInteger(version) || version<1) redirect(`/${lang}/app/dashboard`);
  return <div className="grid gap-6 lg:grid-cols-2"><OnboardingCompletionForm lang={lang} workspaceId={query.workspace} version={version}/><AccountSecurityPanel lang={lang}/></div>;
}
