'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Upload,
  Mail,
  FileSpreadsheet,
  Cpu,
  Zap,
  Droplets,
  Flame,
  Trash2,
  Wrench,
  Filter,
  X,
  Calendar,
  Building2,
  UserCheck,
  Scale,
  History,
  Check,
  FileCheck,
  AlertOctagon,
  RotateCcw,
  SlidersHorizontal,
  FileImage,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { UtilityBill, UtilityWorkflowState, BillType } from '@/types/utilityBills';
import { MOCK_UTILITY_BILLS } from '@/data/mockUtilityBills';
import { PRODUCT_METRICS } from '@/config/product-metrics';

interface UtilityBillsWorkspaceProps {
  lang: Language;
}

export function UtilityBillsWorkspace({ lang }: UtilityBillsWorkspaceProps) {
  const dict = getDictionary(lang);
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  // Workspace Dataset State
  const [bills, setBills] = useState<UtilityBill[]>(MOCK_UTILITY_BILLS);
  const [selectedBillId, setSelectedBillId] = useState<string | null>('UB-2026-001');

  // Complete 7 Filter Dimensions
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [selectedDueDateFilter, setSelectedDueDateFilter] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [filterExceptionsOnly, setFilterExceptionsOnly] = useState<boolean>(false);

  // UI Surfaces & Tab State
  const [detailActiveTab, setDetailActiveTab] = useState<'EXTRACTED' | 'DOCUMENT'>('EXTRACTED');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmActionType, setConfirmActionType] = useState<'APPROVE' | 'POST'>('APPROVE');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Available Buildings & Suppliers dynamically extracted from dataset
  const availableBuildings = useMemo(() => {
    const set = new Set<string>();
    bills.forEach(b => { if (b.buildingName) set.add(b.buildingName); });
    return Array.from(set);
  }, [bills]);

  // Constrain Units dynamically based on selected building
  const availableUnits = useMemo(() => {
    const set = new Set<string>();
    bills.forEach(b => {
      if (selectedBuilding === 'ALL' || b.buildingName === selectedBuilding) {
        if (b.unitNumber) set.add(b.unitNumber);
      }
    });
    return Array.from(set);
  }, [bills, selectedBuilding]);

  const availableSuppliers = useMemo(() => {
    const set = new Set<string>();
    bills.forEach(b => { if (b.supplierName) set.add(b.supplierName); });
    return Array.from(set);
  }, [bills]);

  const availablePeriods = useMemo(() => {
    const set = new Set<string>();
    bills.forEach(b => { if (b.billingPeriod) set.add(b.billingPeriod); });
    return Array.from(set);
  }, [bills]);

  // Formatters for locale consistency
  const formatUnitName = (unit?: string) => {
    if (!unit) return isFa ? 'همه واحدها' : isRo ? 'Toate unitățile' : 'All Units';
    if (isFa) {
      return unit
        .replace(/Scara A \+ Scara B/g, 'ورودی ۱ و ۲')
        .replace(/Scara A/g, 'ورودی ۱')
        .replace(/Scara B/g, 'ورودی ۲')
        .replace(/Total 48 Apartamente/g, 'کل ۴۸ واحد')
        .replace(/Apartamente/g, 'واحدها')
        .replace(/Common Areas & Lift/g, 'مشاعات و آسانسور')
        .replace(/Common Areas/g, 'مشاعات')
        .replace(/Centrală Termică Bloc/g, 'موتورخانه مرکزی')
        .replace(/Branșament Principal/g, 'انشعاب اصلی');
    }
    return unit;
  };

  const formatAccountName = (code: string, roName: string) => {
    if (isFa) {
      if (code === '605.01') return 'هزینه‌های برق مشاعات و آسانسور';
      if (code === '605.02') return 'هزینه‌های آب و فاضلاب';
      if (code === '605.03') return 'هزینه‌های گاز طبیعی موتورخانه';
      if (code === '605.04') return 'هزینه‌های خدمات پسماند و نظافت';
      if (code === '611.01') return 'هزینه‌های سرویس و نگهداری آسانسور';
      return 'سرفصل هزینه‌های جاری';
    }
    return roName;
  };

  const formatAllocationRuleName = (ruleName: string) => {
    if (isFa) {
      if (ruleName.includes('Cota-Parte')) return 'سهم‌القدر مشاعات (بر اساس ضوابط قانونی)';
      if (ruleName.includes('Consum Contorizat')) return 'مصرف کنتور اختصاصی + سهم افت شبکه';
      if (ruleName.includes('Suprafață Utilă')) return 'مساحت زیربنای گرمایشی (متراژ)';
      if (ruleName.includes('Fond Reparații')) return 'صندوق تعمیرات و استهلاک سرمایه‌ای (مالک)';
      if (ruleName.includes('Număr Persoane')) return 'تعداد ساکنان حاضر (نفرات)';
      return 'قاعده مصوب مجمع عمومی';
    }
    return ruleName;
  };

  // Reset all 7 filters
  const handleResetFilters = () => {
    setSelectedType('ALL');
    setSelectedBuilding('ALL');
    setSelectedUnit('ALL');
    setSelectedSupplier('ALL');
    setSelectedPeriod('ALL');
    setSelectedDueDateFilter('ALL');
    setSelectedState('ALL');
    setFilterExceptionsOnly(false);
  };

  const hasActiveFilters = selectedType !== 'ALL' || selectedBuilding !== 'ALL' || selectedUnit !== 'ALL' || selectedSupplier !== 'ALL' || selectedPeriod !== 'ALL' || selectedDueDateFilter !== 'ALL' || selectedState !== 'ALL' || filterExceptionsOnly;

  // Selected bill object
  const selectedBill = useMemo(() => {
    return bills.find(b => b.id === selectedBillId) || bills[0];
  }, [bills, selectedBillId]);

  // Filter evaluation across all 7 dimensions
  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      // 1. Bill Type
      if (selectedType !== 'ALL' && bill.billType !== selectedType) return false;
      // 2. Building
      if (selectedBuilding !== 'ALL' && bill.buildingName !== selectedBuilding) return false;
      // 3. Unit
      if (selectedUnit !== 'ALL' && bill.unitNumber !== selectedUnit) return false;
      // 4. Supplier
      if (selectedSupplier !== 'ALL' && bill.supplierName !== selectedSupplier) return false;
      // 5. Billing Period
      if (selectedPeriod !== 'ALL' && bill.billingPeriod !== selectedPeriod) return false;
      // 6. Due Date Range
      if (selectedDueDateFilter === 'URGENT') {
        const daysToDue = (new Date(bill.dueDate).getTime() - new Date('2026-11-04').getTime()) / (1000 * 3600 * 24);
        if (daysToDue > 7 || bill.workflowState === 'PAID') return false;
      } else if (selectedDueDateFilter === 'OVERDUE') {
        const daysToDue = (new Date(bill.dueDate).getTime() - new Date('2026-11-04').getTime()) / (1000 * 3600 * 24);
        if (daysToDue >= 0 || bill.workflowState === 'PAID') return false;
      }
      // 7. Workflow State
      if (selectedState !== 'ALL' && bill.workflowState !== selectedState) return false;
      // Exceptions Toggle
      if (filterExceptionsOnly && bill.exceptions.length === 0) return false;

      return true;
    });
  }, [bills, selectedType, selectedBuilding, selectedUnit, selectedSupplier, selectedPeriod, selectedDueDateFilter, selectedState, filterExceptionsOnly]);

  // Operational KPI calculations
  const kpis = useMemo(() => {
    const pendingReviewCount = bills.filter(b => b.workflowState === 'EXTRACTED' || b.workflowState === 'MATCHED' || b.workflowState === 'VALIDATED').length;
    const totalExceptionsCount = bills.reduce((acc, b) => acc + b.exceptions.length, 0);
    const dueSoonCount = bills.filter(b => b.workflowState !== 'PAID' && b.workflowState !== 'POSTED').length;
    const readyToPostCount = bills.filter(b => b.workflowState === 'APPROVED' || b.workflowState === 'VALIDATED').length;

    return {
      pendingReviewCount,
      totalExceptionsCount,
      dueSoonCount,
      readyToPostCount,
    };
  }, [bills]);

  // Workflow State Badge Helper
  const getWorkflowBadge = (state: UtilityWorkflowState) => {
    switch (state) {
      case 'RECEIVED':
        return {
          label: isRo ? '1. Primit' : isFa ? '۱. دریافت‌شده' : '1. Received',
          icon: Mail,
          className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        };
      case 'EXTRACTED':
        return {
          label: isRo ? '2. Extras' : isFa ? '۲. استخراج‌شده' : '2. Extracted',
          icon: Cpu,
          className: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        };
      case 'MATCHED':
        return {
          label: isRo ? '3. Potrivit' : isFa ? '۳. تطبیق‌یافته' : '3. Matched',
          icon: Scale,
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      case 'VALIDATED':
        return {
          label: isRo ? '4. Validat' : isFa ? '۴. اعتبارسنجی‌شده' : '4. Validated',
          icon: ShieldCheck,
          className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        };
      case 'APPROVED':
        return {
          label: isRo ? '5. Aprobat' : isFa ? '۵. تأییدشده' : '5. Approved',
          icon: UserCheck,
          className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        };
      case 'POSTED':
        return {
          label: isRo ? '6. Înregistrat' : isFa ? '۶. ثبت‌شده در دفتر' : '6. Posted',
          icon: FileCheck,
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'PAID':
        return {
          label: isRo ? '7. Plătit' : isFa ? '۷. پرداخت‌شده' : '7. Paid',
          icon: CheckCircle2,
          className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      default:
        return {
          label: state,
          icon: Clock,
          className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        };
    }
  };

  const getBillTypeIcon = (type: BillType) => {
    switch (type) {
      case 'ELECTRICITY': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'WATER': return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'GAS': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'WASTE': return <Trash2 className="w-4 h-4 text-emerald-400" />;
      case 'MAINTENANCE_CONTRACT': return <Wrench className="w-4 h-4 text-purple-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  // Human Confirmation Action Handler
  const handleExecuteConfirmation = () => {
    if (!selectedBill) return;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const auditId = `AUD-HA-${Math.floor(100000 + Math.random() * 900000)}`;

    if (confirmActionType === 'APPROVE') {
      const updatedHistory = [
        ...selectedBill.workflowHistory,
        {
          state: 'APPROVED' as UtilityWorkflowState,
          actor: 'Elena Popescu',
          actorRole: 'Property Manager (Authorized Sign-Off)',
          timestamp,
          evidence: `Formal Human Approval Sign-Off Token #${auditId}`,
          auditId,
          comment: 'Verified meter readings, tariff compliance, and statutory owner-tenant split.',
        }
      ];

      setBills(prev => prev.map(b => b.id === selectedBill.id ? {
        ...b,
        workflowState: 'APPROVED',
        workflowHistory: updatedHistory,
        humanReviewRequired: false,
      } : b));

      setActionSuccessMessage(
        isRo
          ? `Factura ${selectedBill.invoiceNumber} a fost aprobată de operatorul uman autorizat. Audit ID: ${auditId}`
          : isFa
          ? `صورت‌حساب ${selectedBill.invoiceNumber} توسط کاربر مجاز انسانی تأیید شد. شناسه ممیزی: ${auditId}`
          : `Invoice ${selectedBill.invoiceNumber} approved by authorized human. Audit ID: ${auditId}`
      );
    } else if (confirmActionType === 'POST') {
      const journalId = `JRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const allocationId = `ALC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const updatedHistory = [
        ...selectedBill.workflowHistory,
        {
          state: 'POSTED' as UtilityWorkflowState,
          actor: 'Elena Popescu',
          actorRole: 'Property Manager (Authorized Sign-Off)',
          timestamp,
          evidence: `Committed to Double-Entry Ledger. Journal ID: ${journalId}, Allocation ID: ${allocationId}`,
          auditId,
          comment: 'Financial posting committed to general ledger.',
        }
      ];

      setBills(prev => prev.map(b => b.id === selectedBill.id ? {
        ...b,
        workflowState: 'POSTED',
        journalId,
        allocationId,
        workflowHistory: updatedHistory,
        humanReviewRequired: false,
      } : b));

      setActionSuccessMessage(
        isRo
          ? `Factura ${selectedBill.invoiceNumber} a fost înregistrată în contabilitate. Jurnal: ${journalId}, Alocare: ${allocationId}`
          : isFa
          ? `صورت‌حساب ${selectedBill.invoiceNumber} در اسناد حسابداری ثبت شد. شناسه سند: ${journalId}`
          : `Invoice ${selectedBill.invoiceNumber} posted to general ledger. Journal: ${journalId}, Allocation: ${allocationId}`
      );
    }

    setIsConfirmModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Strict AI & Human Boundary Header Banner */}
      <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Workspace M25
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {PRODUCT_METRICS.managerWorkspaces} Manager Workspaces • {PRODUCT_METRICS.totalBaseScreens} Screens • {PRODUCT_METRICS.totalResponsiveBaseViews} Views
              </span>
            </div>
            <p className="text-sm font-medium text-slate-200 mt-1">
              <strong className="text-violet-300">
                {isRo
                  ? 'AI sugerează; un operator uman autorizat verifică și confirmă.'
                  : isFa
                  ? 'هوش مصنوعی پیشنهاد می‌دهد؛ کاربر انسانی مجاز بررسی و تأیید نهایی را انجام می‌دهد.'
                  : 'AI suggests; an authorized human reviews and confirms.'}
              </strong>
            </p>
          </div>
        </div>

        {/* Conceptual Intake Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1">{isRo ? 'Canale Recepție:' : isFa ? 'درگاه‌های دریافت:' : 'Intake:'}</span>
          <button
            type="button"
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 inline-flex items-center gap-1.5 transition-colors"
            title="e-Factura SPV Ingestion"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>e-Factura</span>
          </button>
          <button
            type="button"
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 inline-flex items-center gap-1.5 transition-colors"
            title="Dedicated Inbound Email"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>Email</span>
          </button>
          <button
            type="button"
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 inline-flex items-center gap-1.5 transition-colors"
            title="PDF / Image OCR Upload"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>PDF/OCR</span>
          </button>
          <button
            type="button"
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 inline-flex items-center gap-1.5 transition-colors"
            title="CSV Batch Import"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 inline-flex items-center gap-1.5 transition-colors"
            title="REST API EDI"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>API</span>
          </button>
        </div>
      </div>

      {/* Success Alert if Action Performed */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-300 text-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="p-1 text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Operational KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pending Review */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isRo ? 'În Așteptare Revizuire' : isFa ? 'در انتظار بررسی' : 'Pending Review'}
            </span>
            <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {kpis.pendingReviewCount}
          </div>
          <p className="text-xs text-slate-400">
            {isRo ? 'Facturi ce necesită confirmare umană' : isFa ? 'صورت‌حساب‌های نیازمند تأیید' : 'Invoices awaiting human check'}
          </p>
        </div>

        {/* KPI 2: Exceptions Flagged */}
        <div className="p-5 rounded-2xl glass-panel border border-amber-500/30 space-y-2 bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              {isRo ? 'Excepții Detectate' : isFa ? 'مغایرت‌ها و خطاها' : 'Exceptions Flagged'}
            </span>
            <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-300 font-mono">
            {kpis.totalExceptionsCount}
          </div>
          <p className="text-xs text-amber-400/80">
            {isRo ? 'Consum, tarife sau nepotriviri index' : isFa ? 'مغایرت کنتور، تعرفه یا جهش مصرف' : 'Meter, tariff or spike anomalies'}
          </p>
        </div>

        {/* KPI 3: Due Soon */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isRo ? 'Scadențe Active' : isFa ? 'سررسیدهای فعال' : 'Due Soon'}
            </span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {kpis.dueSoonCount}
          </div>
          <p className="text-xs text-slate-400">
            {isRo ? 'Următoarea scadență: 13 Noiembrie' : isFa ? 'نزدیک‌ترین سررسید: ۱۳ نوامبر' : 'Next due date: 13 Nov'}
          </p>
        </div>

        {/* KPI 4: Ready to Post */}
        <div className="p-5 rounded-2xl glass-panel border border-emerald-500/30 space-y-2 bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              {isRo ? 'Gata de Înregistrare' : isFa ? 'آماده ثبت حسابداری' : 'Ready to Post'}
            </span>
            <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FileCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-300 font-mono">
            {kpis.readyToPostCount}
          </div>
          <p className="text-xs text-emerald-400/80">
            {isRo ? 'Valide & conforme Legea 196/2018' : isFa ? 'منطبق بر ضوابط قانونی تسهیم' : 'Validated & compliant'}
          </p>
        </div>
      </div>

      {/* Complete 7-Dimension Desktop Filter Bar */}
      <div className="p-4 rounded-xl glass-panel border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4 text-violet-400" />
            <span>{isRo ? 'Filtrare Coadă Facturi (7 Dimensiuni):' : isFa ? 'فیلتر جامع صف صورت‌حساب‌ها (۷ بعد):' : 'Queue Filters (7 Dimensions):'}</span>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isRo ? 'Resetează Filtrele' : isFa ? 'پاک‌کردن فیلترها' : 'Clear Filters'}</span>
              </button>
            )}

            {/* Mobile Filter Sheet Trigger Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden px-3 py-1 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isRo ? 'Filtre Mobile' : isFa ? 'فیلترهای پیشرفته' : 'Filter Drawer'}</span>
            </button>
          </div>
        </div>

        {/* 7 Filter Select Dropdowns (Desktop & Tablet) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 pt-1">
          {/* 1. Bill Type Filter */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">{isRo ? '1. Utilitate' : isFa ? '۱. نوع قبض' : '1. Bill Type'}</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="ALL">{isRo ? 'Toate tipurile' : isFa ? 'همه موارد' : 'All Types'}</option>
              <option value="ELECTRICITY">{isRo ? 'Electricitate' : isFa ? 'برق' : 'Electricity'}</option>
              <option value="WATER">{isRo ? 'Apă & Canal' : isFa ? 'آب و فاضلاب' : 'Water & Sewage'}</option>
              <option value="GAS">{isRo ? 'Gaze Naturale' : isFa ? 'گاز' : 'Gas'}</option>
              <option value="WASTE">{isRo ? 'Salubritate' : isFa ? 'پسماند' : 'Waste'}</option>
              <option value="MAINTENANCE_CONTRACT">{isRo ? 'Mentenanță Lift' : isFa ? 'نگهداری آسانسور' : 'Elevator'}</option>
            </select>
          </div>

          {/* 2. Building Filter */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">{isRo ? '2. Imobil' : isFa ? '۲. ساختمان' : '2. Building'}</label>
            <select
              value={selectedBuilding}
              onChange={(e) => {
                setSelectedBuilding(e.target.value);
                setSelectedUnit('ALL'); // reset unit when building changes
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="ALL">{isRo ? 'Toate clădirile' : isFa ? 'همه ساختمان‌ها' : 'All Buildings'}</option>
              {availableBuildings.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* 3. Unit Filter (Dynamically Constrained) */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">{isRo ? '3. Spațiu / Unitate' : isFa ? '۳. واحد' : '3. Unit'}</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="ALL">{isRo ? 'Toate unitățile' : isFa ? 'همه واحدها' : 'All Units'}</option>
              {availableUnits.map(u => (
                <option key={u} value={u}>{formatUnitName(u)}</option>
              ))}
            </select>
          </div>

          {/* 4. Supplier Filter */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">{isRo ? '4. Furnizor' : isFa ? '۴. تأمین‌کننده' : '4. Supplier'}</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="ALL">{isRo ? 'Toți furnizorii' : isFa ? 'همه تأمین‌کنندگان' : 'All Suppliers'}</option>
              {availableSuppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 5. Billing Period Filter */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">{isRo ? '5. Perioadă' : isFa ? '۵. دوره مالی' : '5. Period'}</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="ALL">{isRo ? 'Toate perioadele' : isFa ? 'همه دوره‌ها' : 'All Periods'}</option>
              {availablePeriods.map(p => (
                <option key={p} value={p}>{isFa ? 'اکتبر ۲۰۲۶' : p}</option>
              ))}
            </select>
          </div>

          {/* 6. Due Date Range Filter */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">{isRo ? '6. Scadență' : isFa ? '۶. موعد پرداخت' : '6. Due Date'}</label>
            <select
              value={selectedDueDateFilter}
              onChange={(e) => setSelectedDueDateFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="ALL">{isRo ? 'Toate datele' : isFa ? 'همه سررسیدها' : 'All Dates'}</option>
              <option value="URGENT">{isRo ? 'Urgent (< 7 zile)' : isFa ? 'فوری (کمتر از ۷ روز)' : 'Urgent (< 7d)'}</option>
              <option value="OVERDUE">{isRo ? 'Depășite' : isFa ? 'سررسید گذشته' : 'Overdue'}</option>
            </select>
          </div>

          {/* 7. Workflow State Filter */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">{isRo ? '7. Stare Flux' : isFa ? '۷. وضعیت گردش‌کار' : '7. State'}</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="ALL">{isRo ? 'Toate stările' : isFa ? 'همه وضعیت‌ها' : 'All States'}</option>
              <option value="RECEIVED">1. Received</option>
              <option value="EXTRACTED">2. Extracted</option>
              <option value="MATCHED">3. Matched</option>
              <option value="VALIDATED">4. Validated</option>
              <option value="APPROVED">5. Approved</option>
              <option value="POSTED">6. Posted</option>
              <option value="PAID">7. Paid</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Exceptions Toggle */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setFilterExceptionsOnly(!filterExceptionsOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              filterExceptionsOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isRo ? 'Filtrează doar facturile cu excepții' : isFa ? 'فقط صورت‌حساب‌های دارای مغایرت' : 'Show Exceptions Only'}</span>
          </button>

          <div className="text-slate-400 font-mono">
            {filteredBills.length} / {bills.length} {isRo ? 'facturi selectate' : isFa ? 'صورت‌حساب انتخاب‌شده' : 'bills matching criteria'}
          </div>
        </div>
      </div>

      {/* Main Workspace Split View: Left Queue, Right Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Invoice Queue (Desktop Table / Mobile Card List) - 5 cols */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              <span>{isRo ? 'Coada de Facturi & Documente' : isFa ? 'صف صورت‌حساب‌ها و اسناد' : 'Invoice Intake Queue'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{isFa ? 'اکتبر ۲۰۲۶' : 'OCT-2026'}</span>
          </div>

          {/* Desktop & Mobile Card Queue List */}
          <div className="space-y-2.5 max-h-[880px] overflow-y-auto pr-1">
            {filteredBills.length === 0 ? (
              <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-900/40 border border-slate-800">
                {isRo ? 'Nicio factură nu corespunde filtrelor selectate.' : isFa ? 'هیچ صورت‌حسابی با فیلترهای انتخابی مطابقت ندارد.' : 'No invoices match active filters.'}
                <div className="mt-2">
                  <button type="button" onClick={handleResetFilters} className="text-xs text-violet-400 hover:underline">
                    {isRo ? 'Resetează filtrele' : isFa ? 'پاک‌کردن فیلترها' : 'Clear filters'}
                  </button>
                </div>
              </div>
            ) : (
              filteredBills.map((bill) => {
                const badge = getWorkflowBadge(bill.workflowState);
                const BadgeIcon = badge.icon;
                const isSelected = bill.id === selectedBill?.id;

                return (
                  <div
                    key={bill.id}
                    onClick={() => setSelectedBillId(bill.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-violet-950/30 border-violet-500/50 shadow-lg shadow-violet-950/30 ring-1 ring-violet-500/30'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                          {getBillTypeIcon(bill.billType)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white leading-tight">{bill.supplierName}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{bill.invoiceNumber}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-white font-mono">
                          {bill.totalAmount.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {bill.currency}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {isRo ? 'Scadent: ' : isFa ? 'سررسید: ' : 'Due: '}{bill.dueDate}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1 ${badge.className}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>

                        {bill.exceptions.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{bill.exceptions.length}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span>{bill.extractionConfidence}% OCR</span>
                        <span>•</span>
                        <span className="truncate max-w-[140px]">{bill.buildingName} • {formatUnitName(bill.unitNumber)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Bill Surface: Tabs for Extracted Data vs Document Scan (Desktop & Mobile) - 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {selectedBill ? (
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-6">

              {/* Surface Header: ID, Supplier, Action Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-violet-500/20 text-violet-300 font-mono text-xs font-semibold border border-violet-500/30">
                      {selectedBill.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Audit: {selectedBill.auditId}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {selectedBill.supplierName}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {selectedBill.buildingName} • {formatUnitName(selectedBill.unitNumber)} • {isRo ? 'Perioadă: ' : isFa ? 'دوره: ' : 'Period: '}{isFa ? 'اکتبر ۲۰۲۶' : selectedBill.billingPeriod}
                  </p>
                </div>

                {/* Primary Financial Action Button */}
                <div className="flex items-center gap-2">
                  {selectedBill.workflowState !== 'POSTED' && selectedBill.workflowState !== 'PAID' && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmActionType(selectedBill.workflowState === 'APPROVED' ? 'POST' : 'APPROVE');
                        setIsConfirmModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>
                        {selectedBill.workflowState === 'APPROVED'
                          ? (isRo ? 'Înregistrează în Jurnal' : isFa ? 'ثبت نهایی در دفتر کل' : 'Post to Ledger')
                          : (isRo ? 'Revizuire & Aprobare Umană' : isFa ? 'بررسی و تأیید انسانی' : 'Human Review & Approve')}
                      </span>
                    </button>
                  )}

                  {selectedBill.workflowState === 'POSTED' && (
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isRo ? 'Înregistrat în Contabilitate' : isFa ? 'ثبت‌شده در اسناد' : 'Posted to General Ledger'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Surface Tabs: Extracted Data & Financial Truth vs Source Document Scan */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setDetailActiveTab('EXTRACTED')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    detailActiveTab === 'EXTRACTED'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{isRo ? 'Date Extrase & Reconciliere' : isFa ? 'داده‌های استخراج‌شده و تطبیق' : 'Extracted Data & Reconciliation'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailActiveTab('DOCUMENT')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    detailActiveTab === 'DOCUMENT'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileImage className="w-4 h-4" />
                  <span>{isRo ? 'Document Original (PDF / Scan)' : isFa ? 'سند اصلی (اسکن / PDF)' : 'Source Document (PDF/Scan)'}</span>
                </button>
              </div>

              {/* TAB 1: Extracted Data Surface */}
              {detailActiveTab === 'EXTRACTED' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Exception Inspector Alert if Exceptions Present */}
                  {selectedBill.exceptions.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{isRo ? 'Excepții & Nepotriviri Detectate de Motorul de Reguli' : isFa ? 'مغایرت‌های شناسایی‌شده توسط سیستم' : 'Exceptions Detected by Policy Rules'}</span>
                      </div>

                      <div className="space-y-2">
                        {selectedBill.exceptions.map((ex) => (
                          <div
                            key={ex.id}
                            className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                                <AlertOctagon className="w-4 h-4 text-amber-400" />
                                <span>{ex.label}</span>
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {ex.severity} SEVERITY
                              </span>
                            </div>

                            <p className="text-slate-300">{ex.explanation}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-400 border-t border-amber-500/20">
                              <div><strong>{isRo ? 'Câmp Afectat:' : isFa ? 'فیلد متأثر:' : 'Field:'}</strong> {ex.affectedField}</div>
                              <div><strong>{isRo ? 'Dovadă:' : isFa ? 'مستند:' : 'Evidence:'}</strong> {ex.evidence}</div>
                            </div>

                            <div className="p-2 rounded bg-amber-900/20 text-amber-200 border border-amber-500/20 text-[11px]">
                              <strong>{isRo ? 'Acțiune recomandată:' : isFa ? 'اقدام پیشنهادی:' : 'Action:'}</strong> {ex.recommendedAction}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Financial Values & Meter Readings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Financial Summary */}
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>{isRo ? 'Valori Extrase & Fiscale' : isFa ? 'اطلاعات مالی و مالیاتی' : 'Financial Breakdown'}</span>
                        <span className="font-mono text-cyan-400">{selectedBill.extractionConfidence}% Confidence</span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-400">{isRo ? 'Furnizor / CIF:' : isFa ? 'تأمین‌کننده / شناسه ملی:' : 'Supplier / Tax ID:'}</span>
                          <span className="font-mono text-white">{selectedBill.supplierTaxId}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-400">{isRo ? 'IBAN Furnizor:' : isFa ? 'شماره شبا:' : 'Supplier IBAN:'}</span>
                          <span className="font-mono text-slate-300">{selectedBill.supplierIban.substring(0, 14)}...</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-400">{isRo ? 'Valoare Netă:' : isFa ? 'مبلغ خالص:' : 'Net Amount:'}</span>
                          <span className="font-mono text-slate-200">{selectedBill.netAmount.toLocaleString('ro-RO')} {selectedBill.currency}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-400">TVA ({selectedBill.vatRate}%):</span>
                          <span className="font-mono text-slate-200">{selectedBill.vatAmount.toLocaleString('ro-RO')} {selectedBill.currency}</span>
                        </div>
                        <div className="flex justify-between py-1 text-sm font-bold">
                          <span className="text-white">{isRo ? 'Total de Plată:' : isFa ? 'مجموع قابل پرداخت:' : 'Total Due:'}</span>
                          <span className="font-mono text-violet-300">{selectedBill.totalAmount.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {selectedBill.currency}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meter & Tariff Matching */}
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>{isRo ? 'Contorizare & Tarife' : isFa ? 'قرائت کنتور و تعرفه' : 'Meter & Tariff Match'}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          selectedBill.meterMatchStatus === 'MATCHED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {selectedBill.meterMatchStatus}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {selectedBill.meterSerialNumber ? (
                          <>
                            <div className="flex justify-between py-1 border-b border-slate-800">
                              <span className="text-slate-400">{isRo ? 'Serie Contor:' : isFa ? 'شماره سریال کنتور:' : 'Meter Serial #:'}</span>
                              <span className="font-mono text-white">{selectedBill.meterSerialNumber}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800">
                              <span className="text-slate-400">{isRo ? 'Index Pornire / Final:' : isFa ? 'شاخص شروع / پایان:' : 'Start / End Reading:'}</span>
                              <span className="font-mono text-slate-200">{selectedBill.startMeterReading} → {selectedBill.endMeterReading}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800">
                              <span className="text-slate-400">{isRo ? 'Consum Calculat:' : isFa ? 'مصرف محاسبه‌شده:' : 'Consumption:'}</span>
                              <span className="font-mono font-bold text-cyan-300">{selectedBill.calculatedConsumption} {selectedBill.consumptionUnit}</span>
                            </div>
                          </>
                        ) : (
                          <div className="py-2 text-slate-400 italic">
                            {isRo ? 'Fără contor specificat (serviciu fix/contractual)' : isFa ? 'بدون کنتور (خدمات مبتنی بر قرارداد)' : 'No meter (Fixed contractual service)'}
                          </div>
                        )}

                        <div className="flex justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-400">{isRo ? 'Tarif Activ:' : isFa ? 'تعرفه فعال قرارداد:' : 'Active Tariff:'}</span>
                          <span className="text-slate-300">{selectedBill.activeTariffName || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statutory Owner / Tenant Allocation Split (Law 196/2018) */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Scale className="w-4 h-4 text-violet-400" />
                      <span>{isRo ? 'Separare Responsabilitate Proprietar vs Chiriaș (Legea 196/2018)' : isFa ? 'تسهیم سهم مالک و مستأجر بر اساس ضوابط قانونی' : 'Owner vs Tenant Statutory Split'}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
                      <div className="text-slate-300 font-medium">
                        {isRo ? 'Regulă de alocare aplicată: ' : isFa ? 'قاعده تخصیص اعمال‌شده: ' : 'Applied Allocation Rule: '}
                        <strong className="text-violet-300">{formatAllocationRuleName(selectedBill.ownerTenantSplit.allocationRuleName)}</strong>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                        <div>
                          <div className="text-slate-400">{isRo ? 'Cota Proprietar (Fond Reparații):' : isFa ? 'سهم مالک (صندوق عمرانی):' : 'Owner Share (Capital Fund):'}</div>
                          <div className="text-sm font-bold text-white font-mono mt-0.5">
                            {selectedBill.ownerTenantSplit.ownerAmount.toLocaleString('ro-RO')} {selectedBill.currency} ({selectedBill.ownerTenantSplit.ownerPercent}%)
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">{isRo ? 'Cota Chiriaș (Consum Curent):' : isFa ? 'سهم مستأجر (مصرف جاری):' : 'Tenant Share (Operational):'}</div>
                          <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
                            {selectedBill.ownerTenantSplit.tenantAmount.toLocaleString('ro-RO')} {selectedBill.currency} ({selectedBill.ownerTenantSplit.tenantPercent}%)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono pt-1">
                      <div>{isRo ? 'Cont Contabil: ' : isFa ? 'کد حسابداری: ' : 'Accounting Code: '}<strong className="text-slate-200">{selectedBill.accountingCode}</strong> ({formatAccountName(selectedBill.accountingCode, selectedBill.accountingAccountName)})</div>
                      {selectedBill.journalId && <div>{isRo ? 'Jurnal General: ' : isFa ? 'شناسه سند: ' : 'Journal ID: '}<strong className="text-emerald-400">{selectedBill.journalId}</strong></div>}
                    </div>
                  </div>

                  {/* Exact 7-Step Workflow State Timeline */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4 text-violet-400" />
                      <span>{isRo ? 'Jurnal Audit & Etapele Fluxului de Procesare' : isFa ? 'تاریخچه ممیزی و رویدادهای گردش‌کار' : 'Audit Trail & Workflow Events'}</span>
                    </div>

                    <div className="space-y-2">
                      {selectedBill.workflowHistory.map((evt, idx) => {
                        const badge = getWorkflowBadge(evt.state);
                        const EvtIcon = badge.icon;

                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs flex items-start justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg border mt-0.5 ${badge.className}`}>
                                <EvtIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-2">
                                  <span>{badge.label}</span>
                                  <span className="text-slate-400 font-normal">by {evt.actor} ({evt.actorRole})</span>
                                </div>
                                <p className="text-slate-300 text-[11px] mt-0.5">{evt.evidence}</p>
                                {evt.comment && (
                                  <p className="text-slate-400 text-[11px] italic mt-0.5">&ldquo;{evt.comment}&rdquo;</p>
                                )}
                              </div>
                            </div>

                            <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                              <div>{evt.timestamp}</div>
                              <div className="text-violet-400">{evt.auditId}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Original Document Scan View */}
              {detailActiveTab === 'DOCUMENT' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 max-w-md mx-auto space-y-2">
                      <FileImage className="w-12 h-12 text-violet-400 mx-auto" />
                      <div className="text-sm font-bold text-white font-mono">{selectedBill.originalDocumentName}</div>
                      <div className="text-xs text-slate-400">
                        {isRo ? 'Scanare document original atașat la recepția prin ' : isFa ? 'تصویر سند دریافت شده از طریق ' : 'Original document scan ingested via '}{selectedBill.intakeSource}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 max-w-xl mx-auto text-left font-mono text-xs space-y-2 text-slate-300">
                      <div className="text-slate-400 font-bold uppercase tracking-wider">{isRo ? 'Informații OCR Sursă:' : isFa ? 'اطلاعات استخراج متنی سند:' : 'OCR Document Metadata:'}</div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>Document: <strong>{selectedBill.originalDocumentName}</strong></div>
                        <div>Intake: <strong>{selectedBill.intakeSource}</strong></div>
                        <div>Confidence Score: <strong className="text-cyan-400">{selectedBill.extractionConfidence}%</strong></div>
                        <div>Audit Trail Hash: <strong className="text-violet-400">{selectedBill.auditId}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 rounded-2xl glass-panel border border-slate-800">
              {isRo ? 'Selectați o factură din lista din stânga pentru detalii' : isFa ? 'یک صورت‌حساب را جهت مشاهده جزییات انتخاب کنید' : 'Select an invoice from the queue to view details'}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Bottom Sheet Filter Drawer (Accessible on Mobile / Tablet) */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center lg:hidden">
          <div className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-slate-900 border-t border-violet-500/40 p-6 space-y-5 animate-slideUp text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-bold text-white">
                  {isRo ? 'Filtre Coadă Facturi (Mobile)' : isFa ? 'فیلترهای پیشرفته موبایل' : 'Mobile Queue Filters'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Filter Controls */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">{isRo ? 'Tip Utilitate' : isFa ? 'نوع قبض' : 'Bill Type'}</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                >
                  <option value="ALL">Toate tipurile</option>
                  <option value="ELECTRICITY">Electricitate</option>
                  <option value="WATER">Apă & Canal</option>
                  <option value="GAS">Gaze Naturale</option>
                  <option value="WASTE">Salubritate</option>
                  <option value="MAINTENANCE_CONTRACT">Mentenanță Lift</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">{isRo ? 'Imobil / Clădire' : isFa ? 'ساختمان' : 'Building'}</label>
                <select
                  value={selectedBuilding}
                  onChange={(e) => {
                    setSelectedBuilding(e.target.value);
                    setSelectedUnit('ALL');
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                >
                  <option value="ALL">Toate clădirile</option>
                  {availableBuildings.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">{isRo ? 'Spațiu / Unitate' : isFa ? 'واحد' : 'Unit'}</label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                >
                  <option value="ALL">Toate unitățile</option>
                  {availableUnits.map(u => (
                    <option key={u} value={u}>{formatUnitName(u)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">{isRo ? 'Furnizor' : isFa ? 'تأمین‌کننده' : 'Supplier'}</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                >
                  <option value="ALL">Toți furnizorii</option>
                  {availableSuppliers.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">{isRo ? 'Stare Flux' : isFa ? 'وضعیت گردش‌کار' : 'Workflow State'}</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                >
                  <option value="ALL">Toate stările</option>
                  <option value="RECEIVED">1. Received</option>
                  <option value="EXTRACTED">2. Extracted</option>
                  <option value="MATCHED">3. Matched</option>
                  <option value="VALIDATED">4. Validated</option>
                  <option value="APPROVED">5. Approved</option>
                  <option value="POSTED">6. Posted</option>
                  <option value="PAID">7. Paid</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {isRo ? 'Resetează' : isFa ? 'پاک‌کردن' : 'Clear'}
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-lg shadow-violet-600/30"
              >
                {isRo ? 'Aplică Filtrele' : isFa ? 'اعمال فیلتر' : 'Apply Filters'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Human Confirmation Modal Surface (Section 13) */}
      {isConfirmModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-violet-500/50 shadow-2xl p-6 space-y-6 animate-fadeIn text-left">

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {confirmActionType === 'POST'
                      ? (isRo ? 'Confirmare Înregistrare Contabilă' : isFa ? 'تأیید نهایی ثبت سند حسابداری' : 'Confirm Financial Ledger Posting')
                      : (isRo ? 'Revizuire Umană & Aprobare Factură' : isFa ? 'تأیید و صحه‌گذاری نهایی صورت‌حساب' : 'Human Review & Invoice Approval')}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {isRo ? 'Decizie financiară cu responsabilitate legală' : isFa ? 'مسئولیت ثبت اسناد مالی بر عهده کاربر است' : 'Auditable Financial Authorization'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Strict AI Boundary Reminder */}
            <div className="p-3 rounded-lg bg-violet-950/40 border border-violet-500/30 text-xs text-violet-200">
              <strong>{isRo ? 'Limită de Siguranță AI:' : isFa ? 'قاعده بنیادین سیستم:' : 'AI Safety Boundary:'}</strong> {isRo ? 'Sistemul AI doar sugerează datele extrase; aprobarea și înregistrarea în contabilitate devin oficiale exclusiv prin confirmarea dumneavoastră umană. AI nu poate aproba, înregistra sau plăti independent.' : isFa ? 'سامانه هوش مصنوعی صرفاً داده‌های اولیه را استخراج می‌کند؛ ثبت نهایی و ایجاد تعهد مالی منحصراً با تأیید کاربر انسانی معتبر خواهد بود.' : 'AI solely provides suggestions; accounting and financial postings become legally effective only with your authorized human confirmation. AI cannot independently approve, post, or pay.'}
            </div>

            {/* All 11 Required Financial Confirmation Parameters */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              {/* 1. Actor */}
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isRo ? '1. Operator Uman (Actor):' : isFa ? '۱. کاربر تأییدکننده:' : '1. Authorized Actor:'}</span>
                <span className="font-mono text-white">Elena Popescu</span>
              </div>
              {/* 2. Role */}
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isRo ? '2. Rol Responsabil:' : isFa ? '۲. نقش کاربر:' : '2. Authorized Role:'}</span>
                <span className="text-slate-200">Property Manager (Authorized Sign-Off)</span>
              </div>
              {/* 3. Building & Unit Context */}
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isRo ? '3. Imobil / Unitate:' : isFa ? '۳. ساختمان و واحد:' : '3. Building & Unit Context:'}</span>
                <span className="text-slate-200">{selectedBill.buildingName} • {formatUnitName(selectedBill.unitNumber)}</span>
              </div>
              {/* 4. Supplier */}
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isRo ? '4. Furnizor & Factură:' : isFa ? '۴. تأمین‌کننده و شماره سند:' : '4. Supplier & Invoice #:'}</span>
                <span className="font-mono text-white">{selectedBill.supplierName} ({selectedBill.invoiceNumber})</span>
              </div>
              {/* 5. Amount & Currency */}
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isRo ? '5. Sumă Totală & Monedă:' : isFa ? '۵. مبلغ کل سند:' : '5. Total Amount & Currency:'}</span>
                <span className="font-mono font-bold text-violet-300 text-sm">
                  {selectedBill.totalAmount.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {selectedBill.currency}
                </span>
              </div>
              {/* 6. Accounting Code */}
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isRo ? '6. Cont Contabil:' : isFa ? '۶. کد حسابداری:' : '6. Accounting Code:'}</span>
                <span className="font-mono text-slate-200">{selectedBill.accountingCode} ({formatAccountName(selectedBill.accountingCode, selectedBill.accountingAccountName)})</span>
              </div>
              {/* 7. Allocation Rule */}
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isRo ? '7. Regulă de Alocare:' : isFa ? '۷. قاعده تسهیم:' : '7. Allocation Rule:'}</span>
                <span className="text-slate-200">{formatAllocationRuleName(selectedBill.ownerTenantSplit.allocationRuleName)}</span>
              </div>
              {/* 8. Owner / Tenant Split */}
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isRo ? '8. Separare Statutară:' : isFa ? '۸. تفکیک سهم مالک/مستأجر:' : '8. Statutory Split:'}</span>
                <span className="text-slate-200 font-mono">{selectedBill.ownerTenantSplit.ownerPercent}% Owner ({selectedBill.ownerTenantSplit.ownerAmount.toLocaleString('ro-RO')} {selectedBill.currency}) / {selectedBill.ownerTenantSplit.tenantPercent}% Tenant ({selectedBill.ownerTenantSplit.tenantAmount.toLocaleString('ro-RO')} {selectedBill.currency})</span>
              </div>
              {/* 9. Evidence */}
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isRo ? '9. Dovadă & SPV ID:' : isFa ? '۹. مستند و شناسه سامانه:' : '9. Evidence & Source:'}</span>
                <span className="font-mono text-cyan-300 text-[11px]">{selectedBill.originalDocumentName}</span>
              </div>
              {/* 10. Timestamp */}
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isRo ? '10. Timestamp Semnare:' : isFa ? '۱۰. زمان ثبت:' : '10. Signature Timestamp:'}</span>
                <span className="font-mono text-slate-300">2026-11-04 14:30:00</span>
              </div>
              {/* 11. Audit ID */}
              <div className="flex justify-between py-1">
                <span className="text-slate-400">{isRo ? '11. Audit ID:' : isFa ? '۱۱. شناسه ممیزی:' : '11. Audit ID:'}</span>
                <span className="font-mono text-violet-400 font-bold">{selectedBill.auditId}</span>
              </div>
            </div>

            {/* Modal Action Buttons: Back / Cancel + Explicit Confirm */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                {isRo ? 'Anulează / Înapoi' : isFa ? 'انصراف / بازگشت' : 'Back / Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmation}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>
                  {confirmActionType === 'POST'
                    ? (isRo ? 'Confirm Înregistrarea în Jurnal' : isFa ? 'تأیید و ثبت در اسناد' : 'Confirm General Ledger Post')
                    : (isRo ? 'Confirm Aprobarea Facturii' : isFa ? 'تأیید نهایی صورت‌حساب' : 'Confirm Invoice Approval')}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
