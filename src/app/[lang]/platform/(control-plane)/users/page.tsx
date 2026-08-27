import React from 'react';
import { Users2, Shield, UserCheck, Lock } from 'lucide-react';
import type { PlatformUser, PlatformRoleAssignment } from '@/types/platform';

export const dynamic = 'force-dynamic';

export default async function PlatformUsersPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  const mockUsers: Array<PlatformUser & { roles: string[] }> = [
    {
      id: 'usr-cld-admin',
      auth_user_id: 'auth-usr-001',
      employee_ref: 'EMP-SEC-001',
      display_name: 'Lead Security Officer',
      status: 'active',
      roles: ['PLATFORM_SUPER_ADMIN'],
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
      deactivated_at: null,
    },
    {
      id: 'usr-cld-ops',
      auth_user_id: 'auth-usr-002',
      employee_ref: 'EMP-OPS-014',
      display_name: 'Onboarding & Operations Specialist',
      status: 'active',
      roles: ['PLATFORM_OPERATIONS'],
      created_at: '2026-08-10T00:00:00Z',
      updated_at: '2026-08-10T00:00:00Z',
      deactivated_at: null,
    },
    {
      id: 'usr-cld-fin',
      auth_user_id: 'auth-usr-003',
      employee_ref: 'EMP-FIN-003',
      display_name: 'Commercial Accounts Lead',
      status: 'active',
      roles: ['PLATFORM_FINANCE'],
      created_at: '2026-08-15T00:00:00Z',
      updated_at: '2026-08-15T00:00:00Z',
      deactivated_at: null,
    },
    {
      id: 'usr-cld-audit',
      auth_user_id: 'auth-usr-004',
      employee_ref: 'EMP-AUD-009',
      display_name: 'Statutory Compliance Auditor',
      status: 'active',
      roles: ['PLATFORM_AUDITOR'],
      created_at: '2026-08-18T00:00:00Z',
      updated_at: '2026-08-18T00:00:00Z',
      deactivated_at: null,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E3A5A] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Users2 className="w-6 h-6 text-emerald-400" />
            <span>
              {isRo
                ? 'Utilizatori Interni & Roluri Platformă'
                : isFa
                ? 'کاربران داخلی و نقش‌های پلتفرم'
                : 'Internal Platform Users & Roles'}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            {isRo
              ? 'Gestiunea operatorilor interni CLADORA, rolurilor specifice și istoricului de acordare/revocare.'
              : isFa
              ? 'مدیریت کارشناسان داخلی کلادورا، تفکیک نقش‌ها و سوابق اعطا و لغو دسترسی‌ها.'
              : 'Management of internal CLADORA operators, explicit platform roles, and grant/revocation history.'}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0F2236] rounded-xl border border-[#1E3A5A] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#1E3A5A] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isRo ? 'Registru Operatori Autorizați' : isFa ? 'فهرست کارشناسان مجاز' : 'Authorized Operators'}
          </span>
          <span className="text-xs text-slate-400 font-mono">Count: {mockUsers.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#081320] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E3A5A]">
              <tr>
                <th className="py-3 px-4">Operator Name & Ref</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Roles</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A5A] text-slate-300">
              {mockUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#12283E] transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-xs">{u.display_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Ref: {u.employee_ref} • Auth UID: {u.auth_user_id}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      {u.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#14324F] text-emerald-300 border border-[#1D4A73]"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[#14324F] hover:bg-[#1E4A73] text-emerald-300 border border-[#1D4A73] transition">
                      Manage Roles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
