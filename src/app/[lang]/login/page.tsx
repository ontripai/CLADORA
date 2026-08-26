import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';
import React from 'react';
import { Language } from '@/types';
import { LoginForm } from '@/components/auth/LoginForm';




export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}


export async function generateMetadata(
  props: {
    params: Promise<{ lang: Language }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  return getRouteMetadata('/login', params.lang);
}

export default async function LoginPage(props: { params: Promise<{ lang: Language }> }) {
  const params = await props.params;
  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <LoginForm lang={params.lang} />
      </div>
    </main>
  );
}
