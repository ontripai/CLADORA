'use client';

import Script from 'next/script';
import { useEffect, useId, useRef } from 'react';

type TurnstileApi = { render: (container: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };

export function TurnstileWidget({ siteKey, lang, onToken }: { siteKey: string; lang: 'ro'|'en'|'fa'; onToken: (token:string|null)=>void }) {
  const container=useRef<HTMLDivElement>(null); const widget=useRef<string|null>(null); const id=useId();
  function render(){
    const api=(window as typeof window & {turnstile?:TurnstileApi}).turnstile;
    if(!api||!container.current||widget.current) return;
    widget.current=api.render(container.current,{sitekey:siteKey,language:lang==='fa'?'fa':lang,callback:(token:string)=>onToken(token),'expired-callback':()=>onToken(null),'error-callback':()=>onToken(null)});
  }
  useEffect(()=>()=>{const api=(window as typeof window & {turnstile?:TurnstileApi}).turnstile;if(api&&widget.current)api.remove(widget.current);},[]);
  return <><Script id={`turnstile-${id}`} src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={render}/><div ref={container} className="min-h-[65px]" /></>;
}
