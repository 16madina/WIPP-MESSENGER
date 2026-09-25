export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _migrations: {
        Row: {
          applied_at: string
          name: string
        }
        Insert: {
          applied_at?: string
          name: string
        }
        Update: {
          applied_at?: string
          name?: string
        }
        Relationships: []
      }
      wipp_attachment_chunks: {
        Row: {
          attachment_id: string
          chunk_index: number
          ciphertext_b64: string
          created_at: string
          sha256: string
        }
        Insert: {
          attachment_id: string
          chunk_index: number
          ciphertext_b64: string
          created_at?: string
          sha256: string
        }
        Update: {
          attachment_id?: string
          chunk_index?: number
          ciphertext_b64?: string
          created_at?: string
          sha256?: string
        }
        Relationships: [
          {
            foreignKeyName: "wipp_attachment_chunks_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "wipp_attachments"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_attachments: {
        Row: {
          byte_size: number
          chat_id: string
          chunk_count: number
          claimed_at: string | null
          claimed_by: string | null
          consumed_at: string | null
          created_at: string
          id: string
          message_id: string | null
          owner_id: string
          state: string
          view_once: boolean
        }
        Insert: {
          byte_size: number
          chat_id: string
          chunk_count: number
          claimed_at?: string | null
          claimed_by?: string | null
          consumed_at?: string | null
          created_at?: string
          id: string
          message_id?: string | null
          owner_id: string
          state?: string
          view_once?: boolean
        }
        Update: {
          byte_size?: number
          chat_id?: string
          chunk_count?: number
          claimed_at?: string | null
          claimed_by?: string | null
          consumed_at?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          owner_id?: string
          state?: string
          view_once?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "wipp_attachments_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "wipp_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wipp_attachments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id: string
          reason?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "wipp_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wipp_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_call_invites: {
        Row: {
          answered_at: string | null
          callee_id: string
          caller_id: string
          created_at: string
          expires_at: string
          id: string
          kind: string
          room_name: string
          status: string
        }
        Insert: {
          answered_at?: string | null
          callee_id: string
          caller_id: string
          created_at?: string
          expires_at: string
          id: string
          kind?: string
          room_name: string
          status?: string
        }
        Update: {
          answered_at?: string | null
          callee_id?: string
          caller_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          kind?: string
          room_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "wipp_call_invites_callee_id_fkey"
            columns: ["callee_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wipp_call_invites_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_chat_members: {
        Row: {
          archived_at: string | null
          chat_id: string
          joined_at: string
          manually_unread_at: string | null
          muted_until: string | null
          pinned_at: string | null
          profile_id: string
        }
        Insert: {
          archived_at?: string | null
          chat_id: string
          joined_at?: string
          manually_unread_at?: string | null
          muted_until?: string | null
          pinned_at?: string | null
          profile_id: string
        }
        Update: {
          archived_at?: string | null
          chat_id?: string
          joined_at?: string
          manually_unread_at?: string | null
          muted_until?: string | null
          pinned_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wipp_chat_members_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "wipp_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wipp_chat_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_chats: {
        Row: {
          created_at: string
          disappear_after_ms: number | null
          id: string
          realtime_key: string | null
        }
        Insert: {
          created_at?: string
          disappear_after_ms?: number | null
          id: string
          realtime_key?: string | null
        }
        Update: {
          created_at?: string
          disappear_after_ms?: number | null
          id?: string
          realtime_key?: string | null
        }
        Relationships: []
      }
      wipp_devices: {
        Row: {
          created_at: string
          id: string
          kind: string
          label: string
          last_seen_at: string
          profile_id: string
          session_token: string | null
        }
        Insert: {
          created_at?: string
          id: string
          kind?: string
          label?: string
          last_seen_at?: string
          profile_id: string
          session_token?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          label?: string
          last_seen_at?: string
          profile_id?: string
          session_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wipp_devices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wipp_devices_session_token_fkey"
            columns: ["session_token"]
            isOneToOne: false
            referencedRelation: "wipp_sessions"
            referencedColumns: ["token"]
          },
        ]
      }
      wipp_link_codes: {
        Row: {
          claimed_at: string | null
          code: string
          created_at: string
          expires_at: string
          profile_id: string | null
          status: string
          token: string
          user_agent: string | null
        }
        Insert: {
          claimed_at?: string | null
          code: string
          created_at?: string
          expires_at: string
          profile_id?: string | null
          status?: string
          token: string
          user_agent?: string | null
        }
        Update: {
          claimed_at?: string | null
          code?: string
          created_at?: string
          expires_at?: string
          profile_id?: string | null
          status?: string
          token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wipp_link_codes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_message_hides: {
        Row: {
          hidden_at: string
          message_id: string
          profile_id: string
        }
        Insert: {
          hidden_at?: string
          message_id: string
          profile_id: string
        }
        Update: {
          hidden_at?: string
          message_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wipp_message_hides_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "wipp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wipp_message_hides_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_messages: {
        Row: {
          body: string
          chat_id: string
          client_id: string | null
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          expires_at: string | null
          id: string
          pinned_at: string | null
          pinned_by: string | null
          reply_to: string | null
          sender_id: string
        }
        Insert: {
          body: string
          chat_id: string
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          expires_at?: string | null
          id: string
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          chat_id?: string
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          expires_at?: string | null
          id?: string
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wipp_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "wipp_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wipp_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_moderation_access: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          flag_id: string
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          flag_id: string
          id: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          flag_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wipp_moderation_access_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "wipp_moderation_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_moderation_flags: {
        Row: {
          chat_id: string | null
          created_at: string
          id: string
          message_id: string | null
          reason: string
          reporter_id: string | null
          retain_until: string | null
          sealed_payload: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id: string
          message_id?: string | null
          reason?: string
          reporter_id?: string | null
          retain_until?: string | null
          sealed_payload?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          reason?: string
          reporter_id?: string | null
          retain_until?: string | null
          sealed_payload?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wipp_moderation_flags_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_moderation_keys: {
        Row: {
          created_at: string
          id: string
          private_jwk: string
          public_jwk: string
        }
        Insert: {
          created_at?: string
          id: string
          private_jwk: string
          public_jwk: string
        }
        Update: {
          created_at?: string
          id?: string
          private_jwk?: string
          public_jwk?: string
        }
        Relationships: []
      }
      wipp_profiles: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          e2e_public_jwk: Json | null
          firebase_uid: string | null
          id: string
          password_hash: string
          phone_e164: string | null
          role: string
          username: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name: string
          e2e_public_jwk?: Json | null
          firebase_uid?: string | null
          id: string
          password_hash: string
          phone_e164?: string | null
          role?: string
          username: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          e2e_public_jwk?: Json | null
          firebase_uid?: string | null
          id?: string
          password_hash?: string
          phone_e164?: string | null
          role?: string
          username?: string
        }
        Relationships: []
      }
      wipp_push_tokens: {
        Row: {
          created_at: string
          id: string
          kind: string
          platform: string
          profile_id: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          kind?: string
          platform?: string
          profile_id: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          platform?: string
          profile_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wipp_push_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wipp_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "wipp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wipp_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_receipts: {
        Row: {
          delivered_at: string | null
          message_id: string
          profile_id: string
          read_at: string | null
        }
        Insert: {
          delivered_at?: string | null
          message_id: string
          profile_id: string
          read_at?: string | null
        }
        Update: {
          delivered_at?: string | null
          message_id?: string
          profile_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wipp_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "wipp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wipp_receipts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_sessions: {
        Row: {
          created_at: string
          expires_at: string
          profile_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          profile_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          profile_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "wipp_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_touch_candidates: {
        Row: {
          channel: string
          created_at: string
          detected_at: string
          foreground: boolean
          id: string
          invite_id: string
          median_rssi: number | null
          platform: string | null
          profile_id: string
          rssi_samples: Json
          shock_at: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          detected_at: string
          foreground?: boolean
          id: string
          invite_id: string
          median_rssi?: number | null
          platform?: string | null
          profile_id: string
          rssi_samples?: Json
          shock_at?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          detected_at?: string
          foreground?: boolean
          id?: string
          invite_id?: string
          median_rssi?: number | null
          platform?: string | null
          profile_id?: string
          rssi_samples?: Json
          shock_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wipp_touch_candidates_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "wipp_touch_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wipp_touch_candidates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wipp_touch_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      wipp_touch_invites: {
        Row: {
          arbitration: string
          arbitration_log: Json | null
          code: string
          created_at: string
          expires_at: string
          id: string
          matched_profile_id: string | null
          receiver_id: string | null
          resolved_at: string | null
          sender_id: string
          shock_at: string | null
          status: string
        }
        Insert: {
          arbitration?: string
          arbitration_log?: Json | null
          code: string
          created_at?: string
          expires_at: string
          id: string
          matched_profile_id?: string | null
          receiver_id?: string | null
          resolved_at?: string | null
          sender_id: string
          shock_at?: string | null
          status?: string
        }
        Update: {
          arbitration?: string
          arbitration_log?: Json | null
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          matched_profile_id?: string | null
          receiver_id?: string | null
          resolved_at?: string | null
          sender_id?: string
          shock_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "wipp_touch_invites_matched_profile_id_fkey"
            columns: ["matched_profile_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wipp_touch_invites_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wipp_touch_invites_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "wipp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
