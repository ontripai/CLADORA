'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, 
  ActiveContext, 
  WorkOrder, 
  MeterReading, 
  JournalEntry,
  ChargeBreakdownLine,
  PortfolioProperty
} from '@/types';
import { 
  DEMO_ROLES, 
  MOCK_JOURNAL_ENTRIES, 
  MOCK_CHARGE_BREAKDOWN, 
  MOCK_PORTFOLIO_PROPERTIES, 
  MOCK_WORK_ORDERS, 
  MOCK_METER_READINGS 
} from './mockData';

interface DemoStoreContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  context: ActiveContext;
  setContext: React.Dispatch<React.SetStateAction<ActiveContext>>;
  workOrders: WorkOrder[];
  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'createdAt'>) => void;
  meterReadings: MeterReading[];
  addMeterReading: (reading: Omit<MeterReading, 'id' | 'submissionDate'>) => void;
  journalEntries: JournalEntry[];
  chargeBreakdown: ChargeBreakdownLine[];
  portfolioProperties: PortfolioProperty[];
  monthCloseState: {
    period: string;
    status: 'OPEN' | 'VALIDATION' | 'SEALED';
    checklist: {
      invoicesEntered: boolean;
      metersClosed: boolean;
      bankReconciled: boolean;
      allocationsGenerated: boolean;
      censorAudited: boolean;
    };
  };
  updateMonthCloseChecklist: (key: keyof DemoStoreContextType['monthCloseState']['checklist'], value: boolean) => void;
  sealMonthClose: () => void;
  resetDemoData: () => void;
}

const INITIAL_CONTEXT: ActiveContext = {
  organizationId: 'ORG-AV12B',
  organizationName: 'Asociația Rezidențială Aviației 12B',
  associationId: 'ASSOC-01',
  associationName: 'Asociația de Proprietari Aviației 12B',
  buildingId: 'BLD-A1',
  buildingName: 'Bloc A, Scara 1-4 (120 unități)',
  propertyId: 'PROP-01',
  propertyName: 'Str. Aviației nr. 12B, Ap. 14',
  unitId: 'UNIT-14',
  unitNumber: 'Ap. 14',
  currentRole: 'association_admin',
  accountingPeriod: 'OCT-2026'
};

const DemoContext = createContext<DemoStoreContextType | null>(null);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRoleState] = useState<UserRole>('association_admin');
  const [context, setContext] = useState<ActiveContext>(INITIAL_CONTEXT);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>(MOCK_METER_READINGS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(MOCK_JOURNAL_ENTRIES);
  const [chargeBreakdown, setChargeBreakdown] = useState<ChargeBreakdownLine[]>(MOCK_CHARGE_BREAKDOWN);
  const [portfolioProperties, setPortfolioProperties] = useState<PortfolioProperty[]>(MOCK_PORTFOLIO_PROPERTIES);

  const [monthCloseState, setMonthCloseState] = useState<{
    period: string;
    status: 'OPEN' | 'VALIDATION' | 'SEALED';
    checklist: {
      invoicesEntered: boolean;
      metersClosed: boolean;
      bankReconciled: boolean;
      allocationsGenerated: boolean;
      censorAudited: boolean;
    };
  }>({
    period: 'OCT-2026',
    status: 'OPEN',
    checklist: {
      invoicesEntered: true,
      metersClosed: true,
      bankReconciled: true,
      allocationsGenerated: false,
      censorAudited: false
    }
  });

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    setContext(prev => ({ ...prev, currentRole: role }));
  };

  const addWorkOrder = (order: Omit<WorkOrder, 'id' | 'createdAt'>) => {
    const newOrder: WorkOrder = {
      ...order,
      id: `WO-DEMO-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setWorkOrders(prev => [newOrder, ...prev]);
  };

  const addMeterReading = (reading: Omit<MeterReading, 'id' | 'submissionDate'>) => {
    const newReading: MeterReading = {
      ...reading,
      id: `MTR-${Date.now().toString().slice(-4)}`,
      submissionDate: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setMeterReadings(prev => [newReading, ...prev]);
  };

  const updateMonthCloseChecklist = (
    key: keyof DemoStoreContextType['monthCloseState']['checklist'], 
    value: boolean
  ) => {
    setMonthCloseState(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [key]: value
      }
    }));
  };

  const sealMonthClose = () => {
    setMonthCloseState(prev => ({
      ...prev,
      status: 'SEALED',
      checklist: {
        invoicesEntered: true,
        metersClosed: true,
        bankReconciled: true,
        allocationsGenerated: true,
        censorAudited: true
      }
    }));
  };

  const resetDemoData = () => {
    setActiveRoleState('association_admin');
    setContext(INITIAL_CONTEXT);
    setWorkOrders(MOCK_WORK_ORDERS);
    setMeterReadings(MOCK_METER_READINGS);
    setJournalEntries(MOCK_JOURNAL_ENTRIES);
    setChargeBreakdown(MOCK_CHARGE_BREAKDOWN);
    setPortfolioProperties(MOCK_PORTFOLIO_PROPERTIES);
    setMonthCloseState({
      period: 'OCT-2026',
      status: 'OPEN',
      checklist: {
        invoicesEntered: true,
        metersClosed: true,
        bankReconciled: true,
        allocationsGenerated: false,
        censorAudited: false
      }
    });
  };

  return (
    <DemoContext.Provider
      value={{
        activeRole,
        setActiveRole,
        context,
        setContext,
        workOrders,
        addWorkOrder,
        meterReadings,
        addMeterReading,
        journalEntries,
        chargeBreakdown,
        portfolioProperties,
        monthCloseState,
        updateMonthCloseChecklist,
        sealMonthClose,
        resetDemoData
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemoStore = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoStore must be used within a DemoProvider');
  }
  return context;
};
