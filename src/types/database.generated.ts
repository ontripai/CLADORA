export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.17';
  };
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Relationships: [];
      };
    };
    Functions: {
      create_customer_workspace: {
        Args: {
          p_tenant_id: string;
          p_workspace_type: string;
          p_commercial_owner: string;
          p_environment?: string;
        };
        Returns: Database['platform']['Tables']['customer_workspaces']['Row'];
      };
      update_workspace_metadata: {
        Args: {
          p_workspace_id: string;
          p_commercial_owner: string;
          p_reason: string;
        };
        Returns: Database['platform']['Tables']['customer_workspaces']['Row'];
      };
      transition_workspace_lifecycle: {
        Args: {
          p_workspace_id: string;
          p_target_status: string;
          p_expected_version: number;
          p_reason: string;
        };
        Returns: Database['platform']['Tables']['customer_workspaces']['Row'];
      };
      create_provisioning_run: {
        Args: {
          p_workspace_id: string;
          p_idempotency_key: string;
          p_task_types: string[];
        };
        Returns: Database['platform']['Tables']['provisioning_runs']['Row'];
      };
      grant_customer_assignment: {
        Args: {
          p_platform_user_id: string;
          p_customer_workspace_id: string;
          p_scope_type?: string;
          p_scope_id?: string | null;
          p_valid_until?: string | null;
          p_reason?: string;
        };
        Returns: Database['platform']['Tables']['platform_customer_assignments']['Row'];
      };
      revoke_customer_assignment: {
        Args: {
          p_assignment_id: string;
          p_reason: string;
        };
        Returns: Database['platform']['Tables']['platform_customer_assignments']['Row'];
      };
      create_workspace_contract: {
        Args: {
          p_workspace_id: string;
          p_contract_ref: string;
          p_plan_id?: string | null;
          p_currency?: string;
          p_start_date?: string;
          p_end_date?: string | null;
          p_commercial_terms?: Json;
        };
        Returns: Database['platform']['Tables']['workspace_contracts']['Row'];
      };
      activate_workspace_contract: {
        Args: {
          p_contract_id: string;
          p_reason?: string;
        };
        Returns: Database['platform']['Tables']['workspace_contracts']['Row'];
      };
      set_workspace_entitlement: {
        Args: {
          p_workspace_id: string;
          p_entitlement_key: string;
          p_value_type: string;
          p_numeric_value?: number | null;
          p_boolean_value?: boolean | null;
          p_text_value?: string | null;
          p_json_value?: Json | null;
          p_override_value_json?: Json | null;
          p_override_reason?: string | null;
          p_override_expires_at?: string | null;
        };
        Returns: Database['platform']['Tables']['workspace_entitlements']['Row'];
      };
      request_support_access: {
        Args: {
          p_workspace_id: string;
          p_ticket_ref: string;
          p_purpose: string;
          p_requested_scope?: string;
          p_sensitivity_level?: string;
        };
        Returns: Database['platform']['Tables']['support_access_requests']['Row'];
      };
      approve_support_access: {
        Args: {
          p_request_id: string;
          p_duration_interval?: string;
          p_evidence?: Json;
        };
        Returns: Database['platform']['Tables']['support_access_grants']['Row'];
      };
      revoke_support_access: {
        Args: {
          p_grant_id: string;
          p_reason: string;
        };
        Returns: Database['platform']['Tables']['support_access_grants']['Row'];
      };
      enforce_entitlement_quota: {
        Args: {
          p_workspace_id: string;
          p_entitlement_key: string;
          p_requested_quantity: number;
          p_idempotency_key?: string;
          p_reason?: string;
        };
        Returns: boolean;
      };
      create_workspace_invitation: {
        Args: {
          p_workspace_id: string;
          p_email: string;
          p_role_id: string;
          p_scope_type?: string;
          p_expires_in?: string;
          p_reason?: string | null;
        };
        Returns: Array<{
          invitation_id: string;
          invitation_token: string;
          invitation_expires_at: string;
        }>;
      };
      validate_workspace_invitation: {
        Args: { p_token: string };
        Returns: Array<{
          invitation_id: string;
          customer_workspace_id: string;
          invitation_status: string;
          invitation_expires_at: string;
        }>;
      };
      revoke_workspace_invitation: {
        Args: { p_invitation_id: string; p_reason: string };
        Returns: Record<string, unknown>;
      };
      accept_primary_admin_invitation: {
        Args: {
          p_token: string;
          p_display_name: string;
          p_locale?: string;
          p_timezone?: string;
        };
        Returns: Array<{
          customer_workspace_id: string;
          membership_id: string;
          onboarding_required: boolean;
        }>;
      };
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: string;
    };
    CompositeTypes: {
      [key: string]: unknown;
    };
  };
  platform: {
    Tables: {
      platform_users: {
        Row: {
          id: string;
          auth_user_id: string;
          employee_ref: string;
          display_name: string;
          status: string;
          created_at: string;
          updated_at: string;
          deactivated_at: string | null;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          employee_ref: string;
          display_name: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          deactivated_at?: string | null;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          employee_ref?: string;
          display_name?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          deactivated_at?: string | null;
        };
        Relationships: [];
      };
      platform_role_assignments: {
        Row: {
          id: string;
          platform_user_id: string;
          role: string;
          valid_from: string;
          valid_until: string | null;
          status: string;
          granted_by: string | null;
          grant_reason: string;
          revoked_at: string | null;
          revoked_by: string | null;
          revoke_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          platform_user_id: string;
          role: string;
          valid_from?: string;
          valid_until?: string | null;
          status?: string;
          granted_by?: string | null;
          grant_reason: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoke_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          platform_user_id?: string;
          role?: string;
          valid_from?: string;
          valid_until?: string | null;
          status?: string;
          granted_by?: string | null;
          grant_reason?: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoke_reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      customer_workspaces: {
        Row: {
          id: string;
          tenant_id: string;
          workspace_type: string;
          lifecycle_status: string;
          commercial_owner: string;
          environment: string;
          version: number;
          created_at: string;
          updated_at: string;
          activated_at: string | null;
          suspended_at: string | null;
          terminated_at: string | null;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          workspace_type: string;
          lifecycle_status?: string;
          commercial_owner: string;
          environment?: string;
          version?: number;
          created_at?: string;
          updated_at?: string;
          activated_at?: string | null;
          suspended_at?: string | null;
          terminated_at?: string | null;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          workspace_type?: string;
          lifecycle_status?: string;
          commercial_owner?: string;
          environment?: string;
          version?: number;
          created_at?: string;
          updated_at?: string;
          activated_at?: string | null;
          suspended_at?: string | null;
          terminated_at?: string | null;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      platform_customer_assignments: {
        Row: {
          id: string;
          platform_user_id: string;
          customer_workspace_id: string;
          scope_type: string;
          scope_id: string | null;
          valid_from: string;
          valid_until: string | null;
          status: string;
          assigned_by: string | null;
          assignment_reason: string;
          revoked_at: string | null;
          revoked_by: string | null;
          revoke_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          platform_user_id: string;
          customer_workspace_id: string;
          scope_type?: string;
          scope_id?: string | null;
          valid_from?: string;
          valid_until?: string | null;
          status?: string;
          assigned_by?: string | null;
          assignment_reason: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoke_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          platform_user_id?: string;
          customer_workspace_id?: string;
          scope_type?: string;
          scope_id?: string | null;
          valid_from?: string;
          valid_until?: string | null;
          status?: string;
          assigned_by?: string | null;
          assignment_reason?: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoke_reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          plan_code: string;
          version: number;
          display_name: string;
          status: string;
          feature_catalogue: Json;
          limit_schema: Json;
          effective_from: string;
          effective_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_code: string;
          version?: number;
          display_name: string;
          status?: string;
          feature_catalogue?: Json;
          limit_schema?: Json;
          effective_from?: string;
          effective_until?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_code?: string;
          version?: number;
          display_name?: string;
          status?: string;
          feature_catalogue?: Json;
          limit_schema?: Json;
          effective_from?: string;
          effective_until?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_contracts: {
        Row: {
          id: string;
          customer_workspace_id: string;
          plan_id: string | null;
          contract_ref: string;
          version: number;
          currency: string;
          status: string;
          start_date: string;
          end_date: string | null;
          signed_at: string | null;
          activated_at: string | null;
          commercial_terms: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_workspace_id: string;
          plan_id?: string | null;
          contract_ref: string;
          version?: number;
          currency?: string;
          status?: string;
          start_date: string;
          end_date?: string | null;
          signed_at?: string | null;
          activated_at?: string | null;
          commercial_terms?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_workspace_id?: string;
          plan_id?: string | null;
          contract_ref?: string;
          version?: number;
          currency?: string;
          status?: string;
          start_date?: string;
          end_date?: string | null;
          signed_at?: string | null;
          activated_at?: string | null;
          commercial_terms?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_entitlements: {
        Row: {
          id: string;
          customer_workspace_id: string;
          contract_id: string | null;
          entitlement_key: string;
          value_type: string;
          numeric_value: number | null;
          boolean_value: boolean | null;
          text_value: string | null;
          json_value: Json | null;
          valid_from: string;
          valid_until: string | null;
          override_value_json: Json | null;
          override_reason: string | null;
          override_expires_at: string | null;
          override_approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_workspace_id: string;
          contract_id?: string | null;
          entitlement_key: string;
          value_type: string;
          numeric_value?: number | null;
          boolean_value?: boolean | null;
          text_value?: string | null;
          json_value?: Json | null;
          valid_from?: string;
          valid_until?: string | null;
          override_value_json?: Json | null;
          override_reason?: string | null;
          override_expires_at?: string | null;
          override_approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_workspace_id?: string;
          contract_id?: string | null;
          entitlement_key?: string;
          value_type?: string;
          numeric_value?: number | null;
          boolean_value?: boolean | null;
          text_value?: string | null;
          json_value?: Json | null;
          valid_from?: string;
          valid_until?: string | null;
          override_value_json?: Json | null;
          override_reason?: string | null;
          override_expires_at?: string | null;
          override_approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entitlement_usage_ledger: {
        Row: {
          id: string;
          customer_workspace_id: string;
          entitlement_key: string;
          delta: number;
          idempotency_key: string | null;
          reason: string;
          recorded_by: string | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          customer_workspace_id: string;
          entitlement_key: string;
          delta: number;
          idempotency_key?: string | null;
          reason: string;
          recorded_by?: string | null;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          customer_workspace_id?: string;
          entitlement_key?: string;
          delta?: number;
          idempotency_key?: string | null;
          reason?: string;
          recorded_by?: string | null;
          recorded_at?: string;
        };
        Relationships: [];
      };
      provisioning_runs: {
        Row: {
          id: string;
          customer_workspace_id: string;
          idempotency_key: string;
          status: string;
          initiated_by: string | null;
          started_at: string;
          completed_at: string | null;
          failure_reason: string | null;
          evidence_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_workspace_id: string;
          idempotency_key: string;
          status?: string;
          initiated_by?: string | null;
          started_at?: string;
          completed_at?: string | null;
          failure_reason?: string | null;
          evidence_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_workspace_id?: string;
          idempotency_key?: string;
          status?: string;
          initiated_by?: string | null;
          started_at?: string;
          completed_at?: string | null;
          failure_reason?: string | null;
          evidence_json?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      provisioning_tasks: {
        Row: {
          id: string;
          run_id: string;
          task_order: number;
          task_type: string;
          status: string;
          attempt_count: number;
          started_at: string | null;
          completed_at: string | null;
          failure_reason: string | null;
          result_evidence: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          task_order: number;
          task_type: string;
          status?: string;
          attempt_count?: number;
          started_at?: string | null;
          completed_at?: string | null;
          failure_reason?: string | null;
          result_evidence?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          task_order?: number;
          task_type?: string;
          status?: string;
          attempt_count?: number;
          started_at?: string | null;
          completed_at?: string | null;
          failure_reason?: string | null;
          result_evidence?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      support_access_requests: {
        Row: {
          id: string;
          customer_workspace_id: string;
          ticket_ref: string;
          purpose: string;
          requested_scope: string;
          sensitivity_level: string;
          requester_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_workspace_id: string;
          ticket_ref: string;
          purpose: string;
          requested_scope?: string;
          sensitivity_level?: string;
          requester_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_workspace_id?: string;
          ticket_ref?: string;
          purpose?: string;
          requested_scope?: string;
          sensitivity_level?: string;
          requester_id?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      support_access_grants: {
        Row: {
          id: string;
          request_id: string;
          customer_workspace_id: string;
          approver_id: string;
          starts_at: string;
          expires_at: string;
          revoked_at: string | null;
          revoked_by: string | null;
          revoke_reason: string | null;
          activation_evidence: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          customer_workspace_id: string;
          approver_id: string;
          starts_at?: string;
          expires_at: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoke_reason?: string | null;
          activation_evidence?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          customer_workspace_id?: string;
          approver_id?: string;
          starts_at?: string;
          expires_at?: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoke_reason?: string | null;
          activation_evidence?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Relationships: [];
      };
    };
    Functions: {
      create_customer_workspace: {
        Args: {
          p_tenant_id: string;
          p_workspace_type: string;
          p_commercial_owner: string;
          p_environment?: string;
        };
        Returns: Database['platform']['Tables']['customer_workspaces']['Row'];
      };
      update_workspace_metadata: {
        Args: {
          p_workspace_id: string;
          p_commercial_owner: string;
          p_reason: string;
        };
        Returns: Database['platform']['Tables']['customer_workspaces']['Row'];
      };
      transition_workspace_lifecycle: {
        Args: {
          p_workspace_id: string;
          p_target_status: string;
          p_expected_version: number;
          p_reason: string;
        };
        Returns: Database['platform']['Tables']['customer_workspaces']['Row'];
      };
      create_provisioning_run: {
        Args: {
          p_workspace_id: string;
          p_idempotency_key: string;
          p_task_types: string[];
        };
        Returns: Database['platform']['Tables']['provisioning_runs']['Row'];
      };
      grant_customer_assignment: {
        Args: {
          p_platform_user_id: string;
          p_customer_workspace_id: string;
          p_scope_type?: string;
          p_scope_id?: string | null;
          p_valid_until?: string | null;
          p_reason?: string;
        };
        Returns: Database['platform']['Tables']['platform_customer_assignments']['Row'];
      };
      revoke_customer_assignment: {
        Args: {
          p_assignment_id: string;
          p_reason: string;
        };
        Returns: Database['platform']['Tables']['platform_customer_assignments']['Row'];
      };
      create_workspace_contract: {
        Args: {
          p_workspace_id: string;
          p_contract_ref: string;
          p_plan_id?: string | null;
          p_currency?: string;
          p_start_date?: string;
          p_end_date?: string | null;
          p_commercial_terms?: Json;
        };
        Returns: Database['platform']['Tables']['workspace_contracts']['Row'];
      };
      activate_workspace_contract: {
        Args: {
          p_contract_id: string;
          p_reason?: string;
        };
        Returns: Database['platform']['Tables']['workspace_contracts']['Row'];
      };
      set_workspace_entitlement: {
        Args: {
          p_workspace_id: string;
          p_entitlement_key: string;
          p_value_type: string;
          p_numeric_value?: number | null;
          p_boolean_value?: boolean | null;
          p_text_value?: string | null;
          p_json_value?: Json | null;
          p_override_value_json?: Json | null;
          p_override_reason?: string | null;
          p_override_expires_at?: string | null;
        };
        Returns: Database['platform']['Tables']['workspace_entitlements']['Row'];
      };
      request_support_access: {
        Args: {
          p_workspace_id: string;
          p_ticket_ref: string;
          p_purpose: string;
          p_requested_scope?: string;
          p_sensitivity_level?: string;
        };
        Returns: Database['platform']['Tables']['support_access_requests']['Row'];
      };
      approve_support_access: {
        Args: {
          p_request_id: string;
          p_duration_interval?: string;
          p_evidence?: Json;
        };
        Returns: Database['platform']['Tables']['support_access_grants']['Row'];
      };
      revoke_support_access: {
        Args: {
          p_grant_id: string;
          p_reason: string;
        };
        Returns: Database['platform']['Tables']['support_access_grants']['Row'];
      };
      enforce_entitlement_quota: {
        Args: {
          p_workspace_id: string;
          p_entitlement_key: string;
          p_requested_quantity: number;
          p_idempotency_key?: string;
          p_reason?: string;
        };
        Returns: boolean;
      };
      create_workspace_invitation: {
        Args: {
          p_workspace_id: string;
          p_email: string;
          p_role_id: string;
          p_scope_type?: string;
          p_expires_in?: string;
          p_reason?: string | null;
        };
        Returns: Array<{
          invitation_id: string;
          invitation_token: string;
          invitation_expires_at: string;
        }>;
      };
      validate_workspace_invitation: {
        Args: { p_token: string };
        Returns: Array<{
          invitation_id: string;
          customer_workspace_id: string;
          invitation_status: string;
          invitation_expires_at: string;
        }>;
      };
      revoke_workspace_invitation: {
        Args: { p_invitation_id: string; p_reason: string };
        Returns: Record<string, unknown>;
      };
      accept_primary_admin_invitation: {
        Args: {
          p_token: string;
          p_display_name: string;
          p_locale?: string;
          p_timezone?: string;
        };
        Returns: Array<{
          customer_workspace_id: string;
          membership_id: string;
          onboarding_required: boolean;
        }>;
      };
    };
    Enums: {
      platform_role_type:
        | 'PLATFORM_SUPER_ADMIN'
        | 'PLATFORM_OPERATIONS'
        | 'PLATFORM_FINANCE'
        | 'PLATFORM_SUPPORT'
        | 'PLATFORM_AUDITOR';
      workspace_type: 'ASSOCIATION' | 'PROPERTY_MANAGER' | 'OWNER_PORTFOLIO' | 'HYBRID';
      workspace_lifecycle_status:
        | 'LEAD'
        | 'UNDER_REVIEW'
        | 'APPROVED'
        | 'CONTRACT_PENDING'
        | 'PAYMENT_PENDING'
        | 'PROVISIONING'
        | 'ACTIVE'
        | 'PAST_DUE'
        | 'SUSPENDED'
        | 'TERMINATED'
        | 'ARCHIVED';
      workspace_environment: 'PILOT' | 'PRODUCTION';
    };
    CompositeTypes: {
      [key: string]: unknown;
    };
  };
  audit: {
    Tables: {
      events: {
        Row: {
          id: number;
          tenant_id: string | null;
          actor_id: string | null;
          actor_role: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          request_id: string | null;
          before_snapshot: Json | null;
          after_snapshot: Json | null;
          reason: string | null;
          occurred_at: string;
        };
        Insert: {
          id?: number;
          tenant_id?: string | null;
          actor_id?: string | null;
          actor_role?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          request_id?: string | null;
          before_snapshot?: Json | null;
          after_snapshot?: Json | null;
          reason?: string | null;
          occurred_at?: string;
        };
        Update: {
          id?: number;
          tenant_id?: string | null;
          actor_id?: string | null;
          actor_role?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          request_id?: string | null;
          before_snapshot?: Json | null;
          after_snapshot?: Json | null;
          reason?: string | null;
          occurred_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Relationships: [];
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: string;
    };
    CompositeTypes: {
      [key: string]: unknown;
    };
  };
};
