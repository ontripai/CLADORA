import { FileCheck2 } from "lucide-react";
import { OperationalContractsPanel } from "@/components/platform/OperationalContractsPanel";

export const dynamic = "force-dynamic";

export default async function PlatformContractsPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const isRo = lang === "ro";
  const isFa = lang === "fa";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#1E3A5A] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-white md:text-2xl">
            <FileCheck2 className="h-6 w-6 text-emerald-400" aria-hidden="true" />
            <span>
              {isRo
                ? "Contracte Comerciale & Drepturi"
                : isFa
                  ? "قراردادهای تجاری و سهمیه‌های مجاز"
                  : "Commercial Contracts & Entitlements"}
            </span>
          </h1>
          <p className="mt-1 text-xs text-slate-300 md:text-sm">
            {isRo
              ? "Vizualizare operațională, doar în citire, a contractelor, planurilor și drepturilor autorizate."
              : isFa
                ? "نمای عملیاتی فقط‌خواندنی قراردادها، طرح‌ها و سهمیه‌های مجاز هر محیط کاری."
                : "Read-only operational view of authorized contracts, plans, and workspace entitlements."}
          </p>
        </div>
        <span className="w-fit rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
          {isRo ? "Date live · doar citire" : isFa ? "داده زنده · فقط‌خواندنی" : "Live data · read only"}
        </span>
      </div>
      <OperationalContractsPanel lang={lang} />
    </div>
  );
}
