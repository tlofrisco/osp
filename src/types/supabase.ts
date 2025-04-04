export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      canonical_models: {
        Row: {
          entities: Json | null
          id: number
          name: string
          relationships: Json | null
          version: string | null
        }
        Insert: {
          entities?: Json | null
          id?: number
          name: string
          relationships?: Json | null
          version?: string | null
        }
        Update: {
          entities?: Json | null
          id?: number
          name?: string
          relationships?: Json | null
          version?: string | null
        }
        Relationships: []
      }
      service_relationships: {
        Row: {
          from_entity: string
          id: number
          model: string | null
          relationship_type: string | null
          to_entity: string | null
        }
        Insert: {
          from_entity: string
          id?: number
          model?: string | null
          relationship_type?: string | null
          to_entity?: string | null
        }
        Update: {
          from_entity?: string
          id?: number
          model?: string | null
          relationship_type?: string | null
          to_entity?: string | null
        }
        Relationships: []
      }
      service_type_mappings: {
        Row: {
          id: number
          service_type: string
          suggested_models: Json | null
        }
        Insert: {
          id?: number
          service_type: string
          suggested_models?: Json | null
        }
        Update: {
          id?: number
          service_type?: string
          suggested_models?: Json | null
        }
        Relationships: []
      }
      services: {
        Row: {
          blended_model: Json | null
          consumers: Json | null
          created_at: string | null
          framework: string | null
          frameworks: string[] | null
          id: number
          metadata: Json | null
          prompt: string
          provider: string | null
          service_schema: string | null
          spec: string | null
          suppliers: Json | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          blended_model?: Json | null
          consumers?: Json | null
          created_at?: string | null
          framework?: string | null
          frameworks?: string[] | null
          id?: never
          metadata?: Json | null
          prompt: string
          provider?: string | null
          service_schema?: string | null
          spec?: string | null
          suppliers?: Json | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          blended_model?: Json | null
          consumers?: Json | null
          created_at?: string | null
          framework?: string | null
          frameworks?: string[] | null
          id?: never
          metadata?: Json | null
          prompt?: string
          provider?: string | null
          service_schema?: string | null
          spec?: string | null
          suppliers?: Json | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_sql: {
        Args: {
          sql_text: string
        }
        Returns: Json
      }
      table_exists: {
        Args: {
          p_table_name: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  smb_inventory: {
    Tables: {
      inventoryitem: {
        Row: {
          id: string
          itemid: string
          itemname: string
          description: string
          quantity: number
          price: number
          supplierid: string
          suppliedby: string | null // Foreign key to supplier
          stockedin: string | null  // Foreign key to store
        }
        Insert: {
          id?: string
          itemid: string
          itemname: string
          description?: string
          quantity: number
          price: number
          supplierid?: string
          suppliedby?: string | null
          stockedin?: string | null
        }
        Update: {
          id?: string
          itemid?: string
          itemname?: string
          description?: string
          quantity?: number
          price?: number
          supplierid?: string
          suppliedby?: string | null
          stockedin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventoryitem_suppliedby_fkey"
            columns: ["suppliedby"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_stockedin_fkey"
            columns: ["stockedin"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          }
        ]
      }
      supplier: {
        Row: {
          id: string
          supplierid: string
          suppliername: string
          contactinfo: string
          address: string
          supplies: string | null // Foreign key to inventoryitem
        }
        Insert: {
          id?: string
          supplierid: string
          suppliername: string
          contactinfo?: string
          address?: string
          supplies?: string | null
        }
        Update: {
          id?: string
          supplierid?: string
          suppliername?: string
          contactinfo?: string
          address?: string
          supplies?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_supplies_fkey"
            columns: ["supplies"]
            isOneToOne: false
            referencedRelation: "inventoryitem"
            referencedColumns: ["id"]
          }
        ]
      }
      store: {
        Row: {
          id: string
          storeid: string
          storename: string
          location: string
          manager: string
          hasinventory: string | null // Foreign key to inventoryitem
        }
        Insert: {
          id?: string
          storeid: string
          storename: string
          location?: string
          manager?: string
          hasinventory?: string | null
        }
        Update: {
          id?: string
          storeid?: string
          storename?: string
          location?: string
          manager?: string
          hasinventory?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_hasinventory_fkey"
            columns: ["hasinventory"]
            isOneToOne: false
            referencedRelation: "inventoryitem"
            referencedColumns: ["id"]
          }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never