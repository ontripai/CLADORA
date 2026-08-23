import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';
import React from 'react';
import { Language } from '@/types';
import { DemoRoleSelector } from '@/components/demo/DemoRoleSelector';




export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}


export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  return getRouteMetadata('/demo', params.lang);
}

export default function DemoEntryPage({ params }: { params: { lang: Language } }) {
  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC]">
      <DemoRoleSelector lang={params.lang} />
    </main>
  );
}
