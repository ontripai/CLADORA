import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';
import React from 'react';
import { Language } from '@/types';
import { ContactForm } from '@/components/contact/ContactForm';




export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}


export async function generateMetadata(
  props: {
    params: Promise<{ lang: Language }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  return getRouteMetadata('/contact', params.lang);
}

export default async function ContactPage(props: { params: Promise<{ lang: Language }> }) {
  const params = await props.params;
  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC]">
      <ContactForm lang={params.lang} />
    </main>
  );
}
