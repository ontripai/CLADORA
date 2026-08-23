import { 
  JournalEntry, 
  ChargeBreakdownLine, 
  WorkOrder, 
  MeterReading, 
  PortfolioProperty,
  BuildingArchetype,
  CoreFeature,
  RoleDefinition
} from '@/types';

export const DEMO_ROLES: RoleDefinition[] = [
  {
    key: 'association_admin',
    title: { ro: 'Administrator de Bloc', en: 'Association Administrator', fa: 'مدیر ساختمان' },
    description: { 
      ro: 'Închidere de lună, reconciliere bancară, alocare cote cheltuieli, mentenanță și furnizori.',
      en: 'Monthly close, bank reconciliation, quota allocation, maintenance and suppliers.',
      fa: 'بستن دوره ماهانه، تطبیق بانکی، تسهیم هزینه‌های شارژ، مدیریت تعمیرات و تأمین‌کنندگان.'
    },
    badge: { ro: 'Operațional & Financiar', en: 'Operational & Financial', fa: 'عملیاتی و مالی' },
    icon: 'Building2',
    defaultRoute: '/app/dashboard'
  },
  {
    key: 'president',
    title: { ro: 'Președinte de Asociație', en: 'Association President', fa: 'رئیس هیئت‌مدیره انجمن' },
    description: { 
      ro: 'Avizare plăți, reprezentare juridică, convocare AG, monitorizare contracte majore.',
      en: 'Payment approvals, legal representation, AGM scheduling, contract governance.',
      fa: 'تأیید پرداخت‌ها، نمایندگی حقوقی، برگزاری مجامع عمومی و نظارت بر قراردادهای عمده.'
    },
    badge: { ro: 'Guvernanță & Decizie', en: 'Governance & Sign-off', fa: 'حکمرانی و تصمیم‌گیری' },
    icon: 'ShieldCheck',
    defaultRoute: '/app/dashboard'
  },
  {
    key: 'censor',
    title: { ro: 'Cenzor / Auditor Financiar', en: 'Censor / Financial Auditor', fa: 'بازرس / حسابرس انجمن' },
    description: { 
      ro: 'Verificare balanță, jurnal operațiuni, reconciliere conturi, conformitate Legea 196/2018.',
      en: 'Trial balance audits, journal review, fund reconciliations, statutory compliance.',
      fa: 'بررسی تراز آزمایشی، کنترل اسناد دفتر روزنامه، ممیزی صندوق‌ها و انطباق با قوانین.'
    },
    badge: { ro: 'Audit & Conformitate', en: 'Audit & Compliance', fa: 'حسابرسی و انطباق' },
    icon: 'FileCheck',
    defaultRoute: '/app/dashboard'
  },
  {
    key: 'owner',
    title: { ro: 'Proprietar (Rezident)', en: 'Homeowner (Resident)', fa: 'مالک واحد (ساکن)' },
    description: { 
      ro: 'Listă de plată transparentă, transmitere index contoare, vot adunare generală, tichete.',
      en: 'Transparent monthly statement, meter readings submission, AGM voting, tickets.',
      fa: 'صورت‌حساب شفاف ماهانه، ارسال عکس و شاخص کنتور، شرکت در رأی‌گیری مجمع و ثبت تیکت.'
    },
    badge: { ro: 'Proprietate & Drepturi', en: 'Ownership & Rights', fa: 'مالکیت و حقوق' },
    icon: 'Home',
    defaultRoute: '/app/dashboard'
  },
  {
    key: 'tenant_resident',
    title: { ro: 'Chiriaș / Rezident', en: 'Tenant / Resident', fa: 'مستأجر / ساکن' },
    description: { 
      ro: 'Plată cheltuieli operaționale de consum, citire contoare, sesizări mentenanță (fără acces la datele financiare ale proprietarului).',
      en: 'Pay consumption charges, submit meters, report maintenance issues (strictly isolated from owner financial ledger).',
      fa: 'پرداخت هزینه‌های مصرفی، ثبت کنتور، درخواست تعمیرات (با جداسازی کامل از اطلاعات مالی مالک).'
    },
    badge: { ro: 'Consum & Servicii', en: 'Consumption & Living', fa: 'مصارف و خدمات' },
    icon: 'KeyRound',
    defaultRoute: '/app/dashboard'
  },
  {
    key: 'portfolio_owner',
    title: { ro: 'Proprietar Portofoliu (Multi-Property)', en: 'Portfolio Landlord', fa: 'مالک سبد املاک (سرمایه‌گذار)' },
    description: { 
      ro: 'Consolidare 4+ apartamente, monitorizare chirii încasate, yield net, alocare costuri proprietar vs chiriaș.',
      en: 'Consolidate multiple apartments, track rental cashflow, net yield, owner vs tenant expense separation.',
      fa: 'تجمیع مدیریت چندین ملک، پایش دریافت اجاره‌بها، محاسبه بازده خالص و تفکیک مخارج مالک و مستأجر.'
    },
    badge: { ro: 'Randament & Portofoliu', en: 'Yield & Portfolio', fa: 'بازده و سبد املاک' },
    icon: 'TrendingUp',
    defaultRoute: '/app/dashboard'
  },
  {
    key: 'property_manager',
    title: { ro: 'Companie de Administrare (Pro)', en: 'Professional Property Manager', fa: 'شرکت مدیریت املاک (حرفه‌ای)' },
    description: { 
      ro: 'Gestionare 8+ asociații simultan, închidere centralizată de lună, SLA echipe de mentenanță, analiză multi-bloc.',
      en: 'Manage 8+ associations concurrently, batch month-end close, staff SLA metrics, portfolio analytics.',
      fa: 'مدیریت هم‌زمان چندین مجتمع، بستن دسته‌ای دوره‌ها، پایش SLA تکنسین‌ها و تحلیل تجمیعی پروژه‌ها.'
    },
    badge: { ro: 'Multi-Asociație Pro', en: 'Multi-Association Pro', fa: 'مدیریت چندمجتمعی' },
    icon: 'Layers',
    defaultRoute: '/app/dashboard'
  },
  {
    key: 'platform_admin',
    title: { ro: 'Administrator Platformă CLADORA', en: 'Platform Administrator', fa: 'مدیر ارشد سامانه کلادورا' },
    description: { 
      ro: 'Izolare multi-tenant, audit de securitate, feature flags, telemetrie sistem.',
      en: 'Multi-tenant isolation, security audit logs, feature flags, system telemetry.',
      fa: 'جداسازی چندمستأجره داده‌ها، پایش لاگ‌های امنیتی، مدیریت مجوزها و تله‌متری سامانه.'
    },
    badge: { ro: 'Sistem & Securitate', en: 'System & Security', fa: 'سیستم و امنیت' },
    icon: 'Server',
    defaultRoute: '/app/dashboard'
  }
];

export const MOCK_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'JE-2026-1001',
    date: '2026-10-15',
    documentRef: 'FACT-APA-98214',
    description: 'Factură Apă Nova București - Consum apă rece & canal Octombrie',
    debitAccount: '401.01 (Furnizori Utilități)',
    creditAccount: '605.01 (Cheltuieli Apă Rece Asociație)',
    amount: 4820.50,
    status: 'POSTED',
    createdBy: 'Ing. Mihai Voinea (Admin)',
    auditHash: 'sha256:7f8e9a2b1c4d5e6f8a9b'
  },
  {
    id: 'JE-2026-1002',
    date: '2026-10-18',
    documentRef: 'FACT-ENGIE-44120',
    description: 'Factură Engie România - Gaze naturale centrală termică bloc',
    debitAccount: '401.01 (Furnizori Utilități)',
    creditAccount: '605.02 (Cheltuieli Încălzire & Gaze)',
    amount: 7650.00,
    status: 'POSTED',
    createdBy: 'Ing. Mihai Voinea (Admin)',
    auditHash: 'sha256:3a4b5c6d7e8f9a0b1c2d'
  },
  {
    id: 'JE-2026-1003',
    date: '2026-10-20',
    documentRef: 'EXTRAS-BCR-20261020',
    description: 'Încasare cote întreținere prin transfer bancar - Ap. 14, 22, 38',
    debitAccount: '5121.01 (Cont Curent BCR Asociație)',
    creditAccount: '411.01 (Clienți / Proprietari Cote Întreținere)',
    amount: 1495.20,
    status: 'POSTED',
    createdBy: 'Sistem Automat Reconciliere BCR',
    auditHash: 'sha256:9c8b7a6f5e4d3c2b1a0f'
  },
  {
    id: 'JE-2026-1004',
    date: '2026-10-22',
    documentRef: 'FACT-OTIS-1092',
    description: 'Contract Mentenanță Ascensoare - Scara A & B',
    debitAccount: '401.02 (Furnizori Servicii)',
    creditAccount: '611.01 (Cheltuieli Întreținere Lift - CPI)',
    amount: 1200.00,
    status: 'PENDING_AUDIT',
    createdBy: 'Elena Popescu (Contabil)',
    auditHash: 'sha256:2b3c4d5e6f7a8b9c0d1e'
  }
];

export const MOCK_CHARGE_BREAKDOWN: ChargeBreakdownLine[] = [
  {
    id: 'CH-01',
    expenseCategory: 'Apă Rece (Consum Individual)',
    supplierInvoiceRef: 'FACT-APA-98214',
    totalInvoiceAmount: 4820.50,
    allocationMethod: 'METER_CONSUMPTION',
    unitSharePercent: 2.15,
    calculatedAmount: 103.64,
    legalDebtor: 'OWNER',
    operationalPayer: 'TENANT',
    verifiedAt: '2026-10-21 14:30'
  },
  {
    id: 'CH-02',
    expenseCategory: 'Energie Electrică Părți Comune',
    supplierInvoiceRef: 'FACT-ENEL-88219',
    totalInvoiceAmount: 1650.00,
    allocationMethod: 'CPI',
    unitSharePercent: 1.25,
    calculatedAmount: 20.63,
    legalDebtor: 'OWNER',
    operationalPayer: 'TENANT',
    verifiedAt: '2026-10-21 14:30'
  },
  {
    id: 'CH-03',
    expenseCategory: 'Salubrizare & Menajer',
    supplierInvoiceRef: 'FACT-ROMSAL-331',
    totalInvoiceAmount: 2400.00,
    allocationMethod: 'PER_PERSON',
    unitSharePercent: 1.66,
    calculatedAmount: 40.00,
    legalDebtor: 'OWNER',
    operationalPayer: 'TENANT',
    verifiedAt: '2026-10-21 14:30'
  },
  {
    id: 'CH-04',
    expenseCategory: 'Fond de Reparații (Înlocuire Coloană)',
    supplierInvoiceRef: 'HOTARARE-AG-2026-03',
    totalInvoiceAmount: 5000.00,
    allocationMethod: 'CPI',
    unitSharePercent: 1.25,
    calculatedAmount: 62.50,
    legalDebtor: 'OWNER',
    operationalPayer: 'OWNER',
    verifiedAt: '2026-10-21 14:30'
  },
  {
    id: 'CH-05',
    expenseCategory: 'Mentenanță Ascensor & Revizie ISCIR',
    supplierInvoiceRef: 'FACT-OTIS-1092',
    totalInvoiceAmount: 1200.00,
    allocationMethod: 'CPI',
    unitSharePercent: 1.25,
    calculatedAmount: 15.00,
    legalDebtor: 'OWNER',
    operationalPayer: 'TENANT',
    verifiedAt: '2026-10-21 14:30'
  }
];

export const MOCK_PORTFOLIO_PROPERTIES: PortfolioProperty[] = [
  {
    id: 'PROP-01',
    address: 'Str. Aviației nr. 12B, Ap. 14, Sector 1',
    city: 'București',
    unit: 'Ap. 14 (3 camere, 78 mp)',
    associationName: 'Asociația Rezidențială Aviației 12B',
    monthlyRent: 850,
    currency: 'EUR',
    occupancyStatus: 'OCCUPIED',
    tenantName: 'Radu & Andreea Enache',
    leaseEndDate: '2027-08-31',
    netYieldPercent: 6.4,
    monthlyOwnerExpenses: 62.50, // Fond reparatii
    monthlyTenantExpenses: 241.77, // Intretinere lunara
    depositHeld: 1700
  },
  {
    id: 'PROP-02',
    address: 'Bvd. Dimitrie Pompeiu nr. 5-7, Corp B, Ap. 88, Sector 2',
    city: 'București',
    unit: 'Ap. 88 (2 camere, 56 mp)',
    associationName: 'Complex Pipera Plaza Residence',
    monthlyRent: 650,
    currency: 'EUR',
    occupancyStatus: 'OCCUPIED',
    tenantName: 'Cristian Dumitrescu',
    leaseEndDate: '2027-02-28',
    netYieldPercent: 7.1,
    monthlyOwnerExpenses: 45.00,
    monthlyTenantExpenses: 185.30,
    depositHeld: 1300
  },
  {
    id: 'PROP-03',
    address: 'Str. Liviu Rebreanu nr. 18, Bl. A3, Ap. 42, Sector 3',
    city: 'București',
    unit: 'Ap. 42 (Studio, 42 mp)',
    associationName: 'Asociația de Proprietari Titan Park',
    monthlyRent: 480,
    currency: 'EUR',
    occupancyStatus: 'VACANT',
    netYieldPercent: 5.8,
    monthlyOwnerExpenses: 80.00,
    monthlyTenantExpenses: 0.00,
    depositHeld: 0
  },
  {
    id: 'PROP-04',
    address: 'Calea Călărași nr. 120, Ap. 06, Sector 3',
    city: 'București',
    unit: 'Ap. 06 (4 camere, 115 mp)',
    associationName: 'Asociația Călărași Historic Center',
    monthlyRent: 1200,
    currency: 'EUR',
    occupancyStatus: 'OCCUPIED',
    tenantName: 'Ambasada / Expat Office',
    leaseEndDate: '2028-05-15',
    netYieldPercent: 6.9,
    monthlyOwnerExpenses: 120.00,
    monthlyTenantExpenses: 340.00,
    depositHeld: 2400
  }
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-2026-089',
    title: 'Pierdere presiune coloană apă caldă - Tronson 3 (Scara B)',
    buildingName: 'Aviației 12B',
    unitOrArea: 'Subsol Tehnic & Coloană Ap. 22-38',
    category: 'PLUMBING',
    urgency: 'HIGH',
    status: 'IN_PROGRESS',
    assignedTo: 'InstalSanit SRL (Ing. Radu)',
    createdAt: '2026-10-22 08:15',
    slaDeadline: '2026-10-22 18:00'
  },
  {
    id: 'WO-2026-090',
    title: 'Blocare contact senzor ușă lift - Scara A',
    buildingName: 'Aviației 12B',
    unitOrArea: 'Ascensor Principal Sc. A',
    category: 'ELEVATOR',
    urgency: 'HIGH',
    status: 'ASSIGNED',
    assignedTo: 'Otis Servicii Tehnice',
    createdAt: '2026-10-22 10:40',
    slaDeadline: '2026-10-22 14:40'
  },
  {
    id: 'WO-2026-091',
    title: 'Înlocuire senzori prezență LED casa scării etaj 4',
    buildingName: 'Aviației 12B',
    unitOrArea: 'Etaj 4 Scara B',
    category: 'ELECTRICAL',
    urgency: 'LOW',
    status: 'OPEN',
    createdAt: '2026-10-21 16:00',
    slaDeadline: '2026-10-25 18:00'
  }
];

export const MOCK_METER_READINGS: MeterReading[] = [
  {
    id: 'MTR-01',
    unitNumber: 'Ap. 14',
    meterType: 'COLD_WATER',
    meterSerialNumber: 'RO-APA-882194',
    previousIndex: 142.50,
    currentIndex: 148.20,
    consumption: 5.70,
    submissionDate: '2026-10-20 19:15',
    submissionMethod: 'PHOTO_OCR',
    validationStatus: 'VALIDATED'
  },
  {
    id: 'MTR-02',
    unitNumber: 'Ap. 14',
    meterType: 'HOT_WATER',
    meterSerialNumber: 'RO-CALD-331902',
    previousIndex: 88.10,
    currentIndex: 91.40,
    consumption: 3.30,
    submissionDate: '2026-10-20 19:15',
    submissionMethod: 'PHOTO_OCR',
    validationStatus: 'VALIDATED'
  },
  {
    id: 'MTR-03',
    unitNumber: 'Ap. 28',
    meterType: 'COLD_WATER',
    meterSerialNumber: 'RO-APA-992014',
    previousIndex: 210.00,
    currentIndex: 238.50,
    consumption: 28.50,
    submissionDate: '2026-10-21 09:30',
    submissionMethod: 'APP_INPUT',
    validationStatus: 'ANOMALY_FLAGGED' // High consumption compared to avg 6m3
  }
];
