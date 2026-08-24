/**
 * Utility Bills & Invoice Intelligence (M25) Types
 * Binding Definitions for Workflow States, Exceptions, Audit Trails, and Financial Integrity
 */

export type UtilityWorkflowState =
  | 'RECEIVED'
  | 'EXTRACTED'
  | 'MATCHED'
  | 'VALIDATED'
  | 'APPROVED'
  | 'POSTED'
  | 'PAID';

export type IntakeSource =
  | 'API'
  | 'EMAIL'
  | 'E_FACTURA'
  | 'UPLOAD'
  | 'OCR'
  | 'CSV';

export type BillType =
  | 'ELECTRICITY'
  | 'WATER'
  | 'GAS'
  | 'HEATING'
  | 'WASTE'
  | 'MAINTENANCE_CONTRACT';

export type ExceptionCode =
  | 'LOW_CONFIDENCE'
  | 'DUPLICATE_INVOICE'
  | 'CONSUMPTION_SPIKE'
  | 'AMOUNT_SPIKE'
  | 'METER_MISMATCH'
  | 'TARIFF_MISMATCH'
  | 'INVALID_BILLING_PERIOD'
  | 'MISSING_METER_READING'
  | 'PAYMENT_MISMATCH'
  | 'SUPPLIER_CONTRACT_MISMATCH';

export type ExceptionSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type ExceptionResolutionStatus = 'OPEN' | 'RESOLVED' | 'WAIVED_BY_HUMAN';

export interface BillException {
  id: string;
  code: ExceptionCode;
  label: string;
  severity: ExceptionSeverity;
  explanation: string;
  affectedField: string;
  evidence: string;
  recommendedAction: string;
  status: ExceptionResolutionStatus;
}

export interface WorkflowEvent {
  state: UtilityWorkflowState;
  actor: string;
  actorRole: string;
  timestamp: string;
  evidence: string;
  auditId: string;
  comment?: string;
}

export interface HistoricalPeriodComparison {
  period: string;
  consumption: number;
  unit: string;
  amount: number;
  currency: string;
}

export interface UtilityBill {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierTaxId: string;
  supplierIban: string;
  billType: BillType;
  intakeSource: IntakeSource;
  buildingName: string;
  unitNumber?: string;
  billingPeriod: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  netAmount: number;
  vatAmount: number;
  vatRate: number;
  currency: string;

  // Extraction & Confidence
  extractionConfidence: number; // 0 to 100
  fieldConfidences: {
    invoiceNumber: number;
    amount: number;
    dates: number;
    meterReadings: number;
    taxId: number;
  };
  originalDocumentName: string;
  originalDocumentUrl?: string;

  // Meter & Tariff Matching
  meterSerialNumber?: string;
  startMeterReading?: number;
  endMeterReading?: number;
  calculatedConsumption?: number;
  consumptionUnit?: string;
  meterMatchStatus: 'MATCHED' | 'MISMATCH' | 'NO_METER';

  activeTariffName?: string;
  activeTariffRate?: number;
  expectedAmount?: number;
  amountVariance?: number;
  amountVariancePercent?: number;
  tariffMatchStatus: 'MATCHED' | 'MISMATCH';

  // Historical Context
  historicalContext: HistoricalPeriodComparison[];

  // Bank Reconciliation
  bankReconciliationStatus: 'MATCHED' | 'MISMATCH' | 'PENDING';
  bankTransactionId?: string;
  matchedBankAmount?: number;
  bankMatchDate?: string;

  // Cost Allocation & Split
  ownerTenantSplit: {
    ownerAmount: number;
    ownerPercent: number;
    tenantAmount: number;
    tenantPercent: number;
    allocationRuleName: string;
  };

  // Accounting Code & Journal
  accountingCode: string;
  accountingAccountName: string;
  journalId?: string;
  allocationId?: string;
  auditId: string;

  // Workflow & Safety Boundary
  workflowState: UtilityWorkflowState;
  workflowHistory: WorkflowEvent[];
  exceptions: BillException[];
  humanReviewRequired: boolean;
}
