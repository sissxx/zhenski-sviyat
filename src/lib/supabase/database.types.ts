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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string | null
          created_at: string
          ends_at: string | null
          id: string
          image_path: string | null
          is_published: boolean
          link_url: string | null
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          link_url?: string | null
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          link_url?: string | null
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          bank_transfer_bank_name: string | null
          bank_transfer_beneficiary: string | null
          bank_transfer_bic: string | null
          bank_transfer_hold_days: number
          bank_transfer_iban: string | null
          checkout_hold_minutes: number
          consultation_cancel_deadline_hours: number
          consultation_max_advance_days: number
          consultation_max_reschedules: number
          consultation_min_notice_hours: number
          consultation_slot_step_minutes: number
          currency: string
          event_cancel_deadline_hours: number
          id: boolean
          subscription_past_due_grace_days: number
          subscription_renewal_window_days: number
          subscriptions_allow_bank_transfer: boolean
          timezone: string
          updated_at: string
        }
        Insert: {
          bank_transfer_bank_name?: string | null
          bank_transfer_beneficiary?: string | null
          bank_transfer_bic?: string | null
          bank_transfer_hold_days?: number
          bank_transfer_iban?: string | null
          checkout_hold_minutes?: number
          consultation_cancel_deadline_hours?: number
          consultation_max_advance_days?: number
          consultation_max_reschedules?: number
          consultation_min_notice_hours?: number
          consultation_slot_step_minutes?: number
          currency?: string
          event_cancel_deadline_hours?: number
          id?: boolean
          subscription_past_due_grace_days?: number
          subscription_renewal_window_days?: number
          subscriptions_allow_bank_transfer?: boolean
          timezone?: string
          updated_at?: string
        }
        Update: {
          bank_transfer_bank_name?: string | null
          bank_transfer_beneficiary?: string | null
          bank_transfer_bic?: string | null
          bank_transfer_hold_days?: number
          bank_transfer_iban?: string | null
          checkout_hold_minutes?: number
          consultation_cancel_deadline_hours?: number
          consultation_max_advance_days?: number
          consultation_max_reschedules?: number
          consultation_min_notice_hours?: number
          consultation_slot_step_minutes?: number
          currency?: string
          event_cancel_deadline_hours?: number
          id?: boolean
          subscription_past_due_grace_days?: number
          subscription_renewal_window_days?: number
          subscriptions_allow_bank_transfer?: boolean
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          id: number
          new_data: Json | null
          occurred_at: string
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          id?: never
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          id?: never
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      consultation_bookings: {
        Row: {
          blocked_until: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          consultation_type_id: string
          created_at: string
          during: unknown
          ends_at: string
          hold_expires_at: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_provider"] | null
          price_cents: number
          reminder_sent_at: string | null
          reschedule_count: number
          specialist_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
          user_note: string | null
        }
        Insert: {
          blocked_until: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          consultation_type_id: string
          created_at?: string
          during?: unknown
          ends_at: string
          hold_expires_at?: string | null
          id?: string
          payment_method?:
            | Database["public"]["Enums"]["payment_provider"]
            | null
          price_cents: number
          reminder_sent_at?: string | null
          reschedule_count?: number
          specialist_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
          user_note?: string | null
        }
        Update: {
          blocked_until?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          consultation_type_id?: string
          created_at?: string
          during?: unknown
          ends_at?: string
          hold_expires_at?: string | null
          id?: string
          payment_method?:
            | Database["public"]["Enums"]["payment_provider"]
            | null
          price_cents?: number
          reminder_sent_at?: string | null
          reschedule_count?: number
          specialist_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
          user_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_bookings_consultation_type_id_fkey"
            columns: ["consultation_type_id"]
            isOneToOne: false
            referencedRelation: "consultation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_bookings_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_types: {
        Row: {
          allow_bank_transfer: boolean
          buffer_minutes: number
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          location_info: string | null
          name: string
          price_cents: number
          requires_prepayment: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          allow_bank_transfer?: boolean
          buffer_minutes?: number
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean
          location_info?: string | null
          name: string
          price_cents?: number
          requires_prepayment?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allow_bank_transfer?: boolean
          buffer_minutes?: number
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          location_info?: string | null
          name?: string
          price_cents?: number
          requires_prepayment?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          handled_at: string | null
          handled_by: string | null
          id: string
          message: string
          name: string
          phone: string | null
          privacy_accepted: boolean
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          privacy_accepted?: boolean
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          privacy_accepted?: boolean
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          description: string | null
          is_published: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          is_published?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          is_published?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          created_at: string
          dedupe_key: string | null
          error: string | null
          id: string
          provider_message_id: string | null
          related_id: string | null
          related_table: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
          template_key: string
          to_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dedupe_key?: string | null
          error?: string | null
          id?: string
          provider_message_id?: string | null
          related_id?: string | null
          related_table?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          template_key: string
          to_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dedupe_key?: string | null
          error?: string | null
          id?: string
          provider_message_id?: string | null
          related_id?: string | null
          related_table?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          template_key?: string
          to_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_private_details: {
        Row: {
          attendee_instructions: string | null
          event_id: string
          online_url: string | null
          updated_at: string
        }
        Insert: {
          attendee_instructions?: string | null
          event_id: string
          online_url?: string | null
          updated_at?: string
        }
        Update: {
          attendee_instructions?: string | null
          event_id?: string
          online_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_private_details_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_private_details_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          checked_in_at: string | null
          confirmed_at: string | null
          created_at: string
          event_id: string
          hold_expires_at: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_provider"] | null
          price_cents: number
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          checked_in_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          event_id: string
          hold_expires_at?: string | null
          id?: string
          payment_method?:
            | Database["public"]["Enums"]["payment_provider"]
            | null
          price_cents: number
          status: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          checked_in_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          event_id?: string
          hold_expires_at?: string | null
          id?: string
          payment_method?:
            | Database["public"]["Enums"]["payment_provider"]
            | null
          price_cents?: number
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_bank_transfer: boolean
          cancellation_deadline_hours: number | null
          capacity: number | null
          city: string | null
          cover_image_path: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          ends_at: string | null
          format: Database["public"]["Enums"]["event_format"]
          id: string
          is_featured: boolean
          price_cents: number
          published_at: string | null
          registration_deadline: string | null
          registration_opens_at: string | null
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          summary: string | null
          title: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          allow_bank_transfer?: boolean
          cancellation_deadline_hours?: number | null
          capacity?: number | null
          city?: string | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          ends_at?: string | null
          format?: Database["public"]["Enums"]["event_format"]
          id?: string
          is_featured?: boolean
          price_cents?: number
          published_at?: string | null
          registration_deadline?: string | null
          registration_opens_at?: string | null
          slug: string
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          summary?: string | null
          title: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          allow_bank_transfer?: boolean
          cancellation_deadline_hours?: number | null
          capacity?: number | null
          city?: string | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          ends_at?: string | null
          format?: Database["public"]["Enums"]["event_format"]
          id?: string
          is_featured?: boolean
          price_cents?: number
          published_at?: string | null
          registration_deadline?: string | null
          registration_opens_at?: string | null
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          allow_bank_transfer: boolean
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          name: string
          price_cents: number
          slug: string
          sort_order: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          allow_bank_transfer?: boolean
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          slug: string
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          allow_bank_transfer?: boolean
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          slug?: string
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          kind: string
          logo_path: string | null
          name: string
          sort_order: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          kind?: string
          logo_path?: string | null
          name: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          kind?: string
          logo_path?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_note: string | null
          amount_cents: number
          bank_reference: string | null
          confirmed_by: string | null
          consultation_booking_id: string | null
          created_at: string
          currency: string
          description: string | null
          event_registration_id: string | null
          expires_at: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          needs_review: boolean
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          refunded_amount_cents: number
          refunded_at: string | null
          review_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          amount_cents: number
          bank_reference?: string | null
          confirmed_by?: string | null
          consultation_booking_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          event_registration_id?: string | null
          expires_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          needs_review?: boolean
          paid_at?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          refunded_amount_cents?: number
          refunded_at?: string | null
          review_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          amount_cents?: number
          bank_reference?: string | null
          confirmed_by?: string | null
          consultation_booking_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          event_registration_id?: string | null
          expires_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          needs_review?: boolean
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          refunded_amount_cents?: number
          refunded_at?: string | null
          review_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_consultation_booking_id_fkey"
            columns: ["consultation_booking_id"]
            isOneToOne: false
            referencedRelation: "consultation_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_event_registration_id_fkey"
            columns: ["event_registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_viber_groups: {
        Row: {
          plan_id: string
          viber_group_id: string
        }
        Insert: {
          plan_id: string
          viber_group_id: string
        }
        Update: {
          plan_id?: string
          viber_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_viber_groups_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_viber_groups_viber_group_id_fkey"
            columns: ["viber_group_id"]
            isOneToOne: false
            referencedRelation: "viber_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          marketing_consent: boolean
          marketing_consent_at: string | null
          phone: string | null
          privacy_accepted_at: string | null
          status: Database["public"]["Enums"]["account_status"]
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string
          id: string
          last_name?: string
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          phone?: string | null
          privacy_accepted_at?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          phone?: string | null
          privacy_accepted_at?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string
          cta_label: string | null
          cta_url: string | null
          description: string | null
          id: string
          image_path: string | null
          is_published: boolean
          original_price_cents: number | null
          price_cents: number | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          original_price_cents?: number | null
          price_cents?: number | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          original_price_cents?: number | null
          price_cents?: number | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      specialist_availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          specialist_id: string
          start_time: string
          valid_from: string | null
          valid_until: string | null
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          specialist_id: string
          start_time: string
          valid_from?: string | null
          valid_until?: string | null
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          specialist_id?: string
          start_time?: string
          valid_from?: string | null
          valid_until?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "specialist_availability_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_consultation_types: {
        Row: {
          consultation_type_id: string
          price_cents_override: number | null
          specialist_id: string
        }
        Insert: {
          consultation_type_id: string
          price_cents_override?: number | null
          specialist_id: string
        }
        Update: {
          consultation_type_id?: string
          price_cents_override?: number | null
          specialist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_consultation_types_consultation_type_id_fkey"
            columns: ["consultation_type_id"]
            isOneToOne: false
            referencedRelation: "consultation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_consultation_types_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_private: {
        Row: {
          internal_note: string | null
          notification_email: string | null
          phone: string | null
          specialist_id: string
          updated_at: string
        }
        Insert: {
          internal_note?: string | null
          notification_email?: string | null
          phone?: string | null
          specialist_id: string
          updated_at?: string
        }
        Update: {
          internal_note?: string | null
          notification_email?: string | null
          phone?: string | null
          specialist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_private_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: true
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_time_off: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          reason: string | null
          specialist_id: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          reason?: string | null
          specialist_id: string
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          reason?: string | null
          specialist_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_time_off_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialists: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          photo_path: string | null
          slug: string
          sort_order: number
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          photo_path?: string | null
          slug: string
          sort_order?: number
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          photo_path?: string | null
          slug?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specialists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          attempts: number
          id: string
          last_error: string | null
          payload: Json
          processed_at: string | null
          received_at: string
          type: string
        }
        Insert: {
          attempts?: number
          id: string
          last_error?: string | null
          payload: Json
          processed_at?: string | null
          received_at?: string
          type: string
        }
        Update: {
          attempts?: number
          id?: string
          last_error?: string | null
          payload?: Json
          processed_at?: string | null
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          plan_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          plan_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          plan_id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string
          id: string
          is_published: boolean
          member_group: string
          photo_path: string | null
          role_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_published?: boolean
          member_group?: string
          photo_path?: string | null
          role_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_published?: boolean
          member_group?: string
          photo_path?: string | null
          role_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      viber_group_invites: {
        Row: {
          invite_link: string | null
          join_instructions: string | null
          updated_at: string
          viber_group_id: string
        }
        Insert: {
          invite_link?: string | null
          join_instructions?: string | null
          updated_at?: string
          viber_group_id: string
        }
        Update: {
          invite_link?: string | null
          join_instructions?: string | null
          updated_at?: string
          viber_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viber_group_invites_viber_group_id_fkey"
            columns: ["viber_group_id"]
            isOneToOne: true
            referencedRelation: "viber_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      viber_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      viber_memberships: {
        Row: {
          admin_note: string | null
          id: string
          invited_at: string | null
          joined_at: string | null
          removed_at: string | null
          requested_at: string
          status: Database["public"]["Enums"]["viber_access_status"]
          updated_at: string
          user_id: string
          viber_display_name: string | null
          viber_group_id: string
          viber_phone: string | null
        }
        Insert: {
          admin_note?: string | null
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          removed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["viber_access_status"]
          updated_at?: string
          user_id: string
          viber_display_name?: string | null
          viber_group_id: string
          viber_phone?: string | null
        }
        Update: {
          admin_note?: string | null
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          removed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["viber_access_status"]
          updated_at?: string
          user_id?: string
          viber_display_name?: string | null
          viber_group_id?: string
          viber_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viber_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viber_memberships_viber_group_id_fkey"
            columns: ["viber_group_id"]
            isOneToOne: false
            referencedRelation: "viber_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      event_listing: {
        Row: {
          allow_bank_transfer: boolean | null
          cancellation_deadline_hours: number | null
          capacity: number | null
          city: string | null
          cover_image_path: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          ends_at: string | null
          format: Database["public"]["Enums"]["event_format"] | null
          id: string | null
          is_featured: boolean | null
          is_full: boolean | null
          price_cents: number | null
          published_at: string | null
          registration_deadline: string | null
          registration_open: boolean | null
          registration_opens_at: string | null
          seats_left: number | null
          seats_taken: number | null
          slug: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          summary: string | null
          title: string | null
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          allow_bank_transfer?: boolean | null
          cancellation_deadline_hours?: number | null
          capacity?: number | null
          city?: string | null
          cover_image_path?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          ends_at?: string | null
          format?: Database["public"]["Enums"]["event_format"] | null
          id?: string | null
          is_featured?: boolean | null
          is_full?: never
          price_cents?: number | null
          published_at?: string | null
          registration_deadline?: string | null
          registration_open?: never
          registration_opens_at?: string | null
          seats_left?: never
          seats_taken?: never
          slug?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          allow_bank_transfer?: boolean | null
          cancellation_deadline_hours?: number | null
          capacity?: number | null
          city?: string | null
          cover_image_path?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          ends_at?: string | null
          format?: Database["public"]["Enums"]["event_format"] | null
          id?: string | null
          is_featured?: boolean | null
          is_full?: never
          price_cents?: number | null
          published_at?: string | null
          registration_deadline?: string | null
          registration_open?: never
          registration_opens_at?: string | null
          seats_left?: never
          seats_taken?: never
          slug?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      viber_access_actions: {
        Row: {
          action: string | null
          requested_at: string | null
          status: Database["public"]["Enums"]["viber_access_status"] | null
          user_id: string | null
          viber_display_name: string | null
          viber_group_id: string | null
          viber_membership_id: string | null
          viber_phone: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      app_setting: {
        Args: never
        Returns: {
          bank_transfer_bank_name: string | null
          bank_transfer_beneficiary: string | null
          bank_transfer_bic: string | null
          bank_transfer_hold_days: number
          bank_transfer_iban: string | null
          checkout_hold_minutes: number
          consultation_cancel_deadline_hours: number
          consultation_max_advance_days: number
          consultation_max_reschedules: number
          consultation_min_notice_hours: number
          consultation_slot_step_minutes: number
          currency: string
          event_cancel_deadline_hours: number
          id: boolean
          subscription_past_due_grace_days: number
          subscription_renewal_window_days: number
          subscriptions_allow_bank_transfer: boolean
          timezone: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "app_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_payment_success: {
        Args: { p_payment_id: string }
        Returns: undefined
      }
      book_consultation: {
        Args: {
          p_consultation_type_id: string
          p_note?: string
          p_payment_method?: Database["public"]["Enums"]["payment_provider"]
          p_specialist_id: string
          p_starts_at: string
        }
        Returns: {
          amount_cents: number
          bank_reference: string
          booking_id: string
          hold_expires_at: string
          payment_id: string
          status: Database["public"]["Enums"]["booking_status"]
        }[]
      }
      cancel_consultation: {
        Args: { p_booking_id: string; p_reason?: string }
        Returns: {
          blocked_until: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          consultation_type_id: string
          created_at: string
          during: unknown
          ends_at: string
          hold_expires_at: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_provider"] | null
          price_cents: number
          reminder_sent_at: string | null
          reschedule_count: number
          specialist_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
          user_note: string | null
        }
        SetofOptions: {
          from: "*"
          to: "consultation_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_event_registration: {
        Args: { p_reason?: string; p_registration_id: string }
        Returns: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          checked_in_at: string | null
          confirmed_at: string | null
          created_at: string
          event_id: string
          hold_expires_at: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_provider"] | null
          price_cents: number
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "event_registrations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_bank_transfer: {
        Args: { p_note?: string; p_payment_id: string }
        Returns: {
          admin_note: string | null
          amount_cents: number
          bank_reference: string | null
          confirmed_by: string | null
          consultation_booking_id: string | null
          created_at: string
          currency: string
          description: string | null
          event_registration_id: string | null
          expires_at: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          needs_review: boolean
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          refunded_amount_cents: number
          refunded_at: string | null
          review_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      consultation_slots: {
        Args: {
          p_consultation_type_id: string
          p_from: string
          p_ignore_booking_id?: string
          p_specialist_id: string
          p_to: string
        }
        Returns: {
          ends_at: string
          starts_at: string
        }[]
      }
      create_pending_payment: {
        Args: {
          p_amount_cents: number
          p_booking_id?: string
          p_description: string
          p_expires_at: string
          p_provider: Database["public"]["Enums"]["payment_provider"]
          p_registration_id?: string
          p_subscription_id?: string
          p_user_id: string
        }
        Returns: {
          admin_note: string | null
          amount_cents: number
          bank_reference: string | null
          confirmed_by: string | null
          consultation_booking_id: string | null
          created_at: string
          currency: string
          description: string | null
          event_registration_id: string | null
          expires_at: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          needs_review: boolean
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          refunded_amount_cents: number
          refunded_at: string | null
          review_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      eligible_viber_group_ids: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      event_seats_taken: { Args: { p_event_id: string }; Returns: number }
      expire_stale_holds: { Args: never; Returns: undefined }
      flag_paid_for_refund_decision: {
        Args: { p_booking_id: string; p_registration_id: string }
        Returns: undefined
      }
      get_available_slots: {
        Args: {
          p_consultation_type_id: string
          p_from: string
          p_specialist_id: string
          p_to: string
        }
        Returns: {
          ends_at: string
          starts_at: string
        }[]
      }
      has_active_plan: {
        Args: { p_plan_id: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { p_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_client_of_my_specialist: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      is_eligible_for_viber_group: {
        Args: { p_group_id: string }
        Returns: boolean
      }
      is_service_role: { Args: never; Returns: boolean }
      mark_payment_failed: {
        Args: {
          p_payment_id: string
          p_reason?: string
          p_status?: Database["public"]["Enums"]["payment_status"]
        }
        Returns: {
          admin_note: string | null
          amount_cents: number
          bank_reference: string | null
          confirmed_by: string | null
          consultation_booking_id: string | null
          created_at: string
          currency: string
          description: string | null
          event_registration_id: string | null
          expires_at: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          needs_review: boolean
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          refunded_amount_cents: number
          refunded_at: string | null
          review_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_payment_succeeded: {
        Args: {
          p_amount_cents: number
          p_payment_id: string
          p_stripe_checkout_session_id?: string
          p_stripe_payment_intent_id?: string
        }
        Returns: {
          admin_note: string | null
          amount_cents: number
          bank_reference: string | null
          confirmed_by: string | null
          consultation_booking_id: string | null
          created_at: string
          currency: string
          description: string | null
          event_registration_id: string | null
          expires_at: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          needs_review: boolean
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          refunded_amount_cents: number
          refunded_at: string | null
          review_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      my_specialist_id: { Args: never; Returns: string }
      my_viber_groups: {
        Args: never
        Returns: {
          access_status: Database["public"]["Enums"]["viber_access_status"]
          description: string
          invite_link: string
          join_instructions: string
          name: string
          viber_group_id: string
        }[]
      }
      record_refund: {
        Args: { p_payment_id: string; p_refunded_amount_cents: number }
        Returns: {
          admin_note: string | null
          amount_cents: number
          bank_reference: string | null
          confirmed_by: string | null
          consultation_booking_id: string | null
          created_at: string
          currency: string
          description: string | null
          event_registration_id: string | null
          expires_at: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          needs_review: boolean
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          refunded_amount_cents: number
          refunded_at: string | null
          review_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_stripe_invoice: {
        Args: {
          p_amount_cents: number
          p_failure_reason?: string
          p_paid: boolean
          p_stripe_invoice_id: string
          p_stripe_subscription_id: string
        }
        Returns: {
          admin_note: string | null
          amount_cents: number
          bank_reference: string | null
          confirmed_by: string | null
          consultation_booking_id: string | null
          created_at: string
          currency: string
          description: string | null
          event_registration_id: string | null
          expires_at: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          needs_review: boolean
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          refunded_amount_cents: number
          refunded_at: string | null
          review_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      register_for_event: {
        Args: {
          p_event_id: string
          p_payment_method?: Database["public"]["Enums"]["payment_provider"]
        }
        Returns: {
          amount_cents: number
          bank_reference: string
          hold_expires_at: string
          payment_id: string
          registration_id: string
          status: Database["public"]["Enums"]["registration_status"]
        }[]
      }
      release_payment_hold: {
        Args: { p_payment_id: string }
        Returns: undefined
      }
      request_viber_access: {
        Args: {
          p_viber_display_name?: string
          p_viber_group_id: string
          p_viber_phone?: string
        }
        Returns: {
          admin_note: string | null
          id: string
          invited_at: string | null
          joined_at: string | null
          removed_at: string | null
          requested_at: string
          status: Database["public"]["Enums"]["viber_access_status"]
          updated_at: string
          user_id: string
          viber_display_name: string | null
          viber_group_id: string
          viber_phone: string | null
        }
        SetofOptions: {
          from: "*"
          to: "viber_memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      require_active_user: { Args: never; Returns: string }
      require_admin_or_service: { Args: never; Returns: undefined }
      reschedule_consultation: {
        Args: { p_booking_id: string; p_new_starts_at: string }
        Returns: {
          blocked_until: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          consultation_type_id: string
          created_at: string
          during: unknown
          ends_at: string
          hold_expires_at: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_provider"] | null
          price_cents: number
          reminder_sent_at: string | null
          reschedule_count: number
          specialist_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
          user_note: string | null
        }
        SetofOptions: {
          from: "*"
          to: "consultation_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      run_maintenance: { Args: never; Returns: Json }
      set_booking_outcome: {
        Args: {
          p_booking_id: string
          p_status: Database["public"]["Enums"]["booking_status"]
        }
        Returns: {
          blocked_until: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          consultation_type_id: string
          created_at: string
          during: unknown
          ends_at: string
          hold_expires_at: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_provider"] | null
          price_cents: number
          reminder_sent_at: string | null
          reschedule_count: number
          specialist_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
          user_note: string | null
        }
        SetofOptions: {
          from: "*"
          to: "consultation_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      slot_is_bookable: {
        Args: {
          p_consultation_type_id: string
          p_ignore_booking_id?: string
          p_specialist_id: string
          p_starts_at: string
        }
        Returns: boolean
      }
      start_bank_transfer_subscription: {
        Args: { p_plan_id: string }
        Returns: {
          amount_cents: number
          bank_reference: string
          expires_at: string
          payment_id: string
          subscription_id: string
        }[]
      }
      subscription_grants_access: {
        Args: { s: Database["public"]["Tables"]["subscriptions"]["Row"] }
        Returns: boolean
      }
      sync_stripe_subscription: {
        Args: {
          p_cancel_at_period_end?: boolean
          p_canceled_at?: string
          p_current_period_end: string
          p_current_period_start: string
          p_ended_at?: string
          p_status: string
          p_stripe_customer_id: string
          p_stripe_price_id: string
          p_stripe_subscription_id: string
          p_user_id: string
        }
        Returns: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          plan_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      account_status: "active" | "suspended"
      app_role: "admin" | "specialist"
      billing_interval: "month" | "year"
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
        | "expired"
      email_status: "queued" | "sent" | "failed" | "skipped"
      event_format: "in_person" | "online" | "hybrid"
      event_status: "draft" | "published" | "cancelled" | "completed"
      payment_provider: "stripe" | "bank_transfer"
      payment_status:
        | "pending"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "expired"
        | "refunded"
        | "partially_refunded"
      registration_status:
        | "pending_payment"
        | "confirmed"
        | "cancelled"
        | "expired"
      subscription_status:
        | "pending_bank_transfer"
        | "incomplete"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "expired"
      viber_access_status:
        | "pending_invite"
        | "invited"
        | "joined"
        | "removal_pending"
        | "removed"
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
    Enums: {
      account_status: ["active", "suspended"],
      app_role: ["admin", "specialist"],
      billing_interval: ["month", "year"],
      booking_status: [
        "pending_payment",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
        "expired",
      ],
      email_status: ["queued", "sent", "failed", "skipped"],
      event_format: ["in_person", "online", "hybrid"],
      event_status: ["draft", "published", "cancelled", "completed"],
      payment_provider: ["stripe", "bank_transfer"],
      payment_status: [
        "pending",
        "succeeded",
        "failed",
        "cancelled",
        "expired",
        "refunded",
        "partially_refunded",
      ],
      registration_status: [
        "pending_payment",
        "confirmed",
        "cancelled",
        "expired",
      ],
      subscription_status: [
        "pending_bank_transfer",
        "incomplete",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "expired",
      ],
      viber_access_status: [
        "pending_invite",
        "invited",
        "joined",
        "removal_pending",
        "removed",
      ],
    },
  },
} as const
