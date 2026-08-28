import { redirect } from 'next/navigation';
import { AccountSecurityPanel } from '@/components/auth/AccountSecurityPanel';
import { OnboardingCompletionForm } from '@/components/auth/OnboardingCompletionForm';
import { createClient } from '@/lib/supabase/server';
import { isSupportedLocale } from '@/types';

export default async function OnboardingPage({ params, searchParams }: { params: Promise<{lang:string}>; searchParams: Promise<{workspace?:string}> }) {
  const {lang}=await params; if(!isSupportedLocale(lang)) redirect('/ro/login');
  const query=await searchParams;
  if(!query.workspace || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.workspace)) redirect(`/${lang}/app/dashboard`);

  const supabase = await createClient();
  const { data, error } = await supabase
    .schema('platform')
    .rpc('get_my_primary_admin_onboarding', { p_workspace_id: query.workspace });
  const state = Array.isArray(data) ? data[0] : data;
  if (error || !state) redirect(`/${lang}/app/dashboard`);

  return <div className="grid gap-6 lg:grid-cols-2"><OnboardingCompletionForm lang={lang} workspaceId={state.customer_workspace_id} version={state.workspace_version} completed={state.onboarding_completed}/><AccountSecurityPanel lang={lang}/></div>;
}
