import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';
import React from 'react';
import { Language } from '@/types';
import { ContactForm } from '@/components/contact/ContactForm';




export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}


export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  return getRouteMetadata('/contact', params.lang);
}

export default function ContactPage({ params }: { params: { lang: Language } }) {
  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC]">
      <ContactForm lang={params.lang} />
    </main>
  );
}
