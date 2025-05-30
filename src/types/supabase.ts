export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  ai_osp_runtime: {
    Tables: {
      agent_event_log: {
        Row: {
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          decision_outcome: string | null
          detected_at: string | null
          event_description: string | null
          event_id: string
          rule_id: number | null
          run_id: string
          status: string | null
        }
        Insert: {
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          decision_outcome?: string | null
          detected_at?: string | null
          event_description?: string | null
          event_id?: string
          rule_id?: number | null
          run_id?: string
          status?: string | null
        }
        Update: {
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          decision_outcome?: string | null
          detected_at?: string | null
          event_description?: string | null
          event_id?: string
          rule_id?: number | null
          run_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_event_log_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_run_log"
            referencedColumns: ["run_id"]
          },
        ]
      }
      agent_run_log: {
        Row: {
          created_at: string
          ended_at: string | null
          result_summary: string | null
          run_id: string
          started_at: string | null
          status: string | null
          trigger_event_id: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          result_summary?: string | null
          run_id?: string
          started_at?: string | null
          status?: string | null
          trigger_event_id?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          result_summary?: string | null
          run_id?: string
          started_at?: string | null
          status?: string | null
          trigger_event_id?: string | null
        }
        Relationships: []
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
  osp_metadata: {
    Tables: {
      hardcore_rules: {
        Row: {
          content_md: string | null
          created_at: string | null
          id: number | null
          service_scope: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content_md?: string | null
          created_at?: string | null
          id?: number | null
          service_scope?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content_md?: string | null
          created_at?: string | null
          id?: number | null
          service_scope?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
        Args: { sql_text: string }
        Returns: Json
      }
      get_smb_inventory_items: {
        Args: { p_table_name?: string }
        Returns: {
          item: Json
        }[]
      }
      get_smb_inventory_model: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_smb_inventory_stores: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string | null
          contactinfo: string | null
          contactnumber: string | null
          email: string | null
          has_bike_parts: string | null
          has_inventory: string | null
          has_parts: string | null
          hasbikeparts: string | null
          hasinventory: string | null
          hasparts: string | null
          holdsinventory: string | null
          id: string
          inventory: string | null
          location: string | null
          manager: string | null
          managername: string | null
          managesinventory: string | null
          name: string | null
          offers: string | null
          storeid: string | null
          storelocation: string | null
          storename: string | null
        }[]
      }
      get_smb_inventory_suppliers: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string | null
          contactemail: string | null
          contactinfo: string | null
          contactinformation: string | null
          contactnumber: string | null
          contactperson: string | null
          email: string | null
          id: string
          inventoryitems: string | null
          name: string | null
          provides: string | null
          providesbikeparts: string | null
          providesparts: string | null
          supplierid: string | null
          suppliername: string | null
          supplies: string | null
          supplies_bike_parts: string | null
          supplies_inventory: string | null
          supplies_items: string | null
          supplies_parts: string | null
          suppliesinventory: string | null
          suppliesitems: string | null
          suppliespart: string | null
          suppliesparts: string | null
        }[]
      }
      table_exists: {
        Args: { p_table_name: string }
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
      bikepart: {
        Row: {
          associated_with_inventory: string | null
          belongs_to_store: string | null
          bikepartid: string | null
          category: string | null
          cost: number | null
          description: string | null
          has_inventory: string | null
          id: string
          is_inventory_item: string | null
          ispartofinventory: string | null
          manufacturer: string | null
          modelnumber: string | null
          name: string | null
          partcategory: string | null
          partdescription: string | null
          partid: string | null
          partname: string | null
          partnumber: string | null
          parttype: string | null
          price: number | null
          quantity: number | null
          quantityavailable: number | null
          quantityinstock: number | null
          related_to_inventory_item: string | null
          stockedin: string | null
          stored_in: string | null
          storedin: string | null
          storeid: string | null
          storelocation: string | null
          supplied_by: string | null
          suppliedby: string | null
          supplier: string | null
          supplierid: string | null
          supplierinfo: string | null
        }
        Insert: {
          associated_with_inventory?: string | null
          belongs_to_store?: string | null
          bikepartid?: string | null
          category?: string | null
          cost?: number | null
          description?: string | null
          has_inventory?: string | null
          id: string
          is_inventory_item?: string | null
          ispartofinventory?: string | null
          manufacturer?: string | null
          modelnumber?: string | null
          name?: string | null
          partcategory?: string | null
          partdescription?: string | null
          partid?: string | null
          partname?: string | null
          partnumber?: string | null
          parttype?: string | null
          price?: number | null
          quantity?: number | null
          quantityavailable?: number | null
          quantityinstock?: number | null
          related_to_inventory_item?: string | null
          stockedin?: string | null
          stored_in?: string | null
          storedin?: string | null
          storeid?: string | null
          storelocation?: string | null
          supplied_by?: string | null
          suppliedby?: string | null
          supplier?: string | null
          supplierid?: string | null
          supplierinfo?: string | null
        }
        Update: {
          associated_with_inventory?: string | null
          belongs_to_store?: string | null
          bikepartid?: string | null
          category?: string | null
          cost?: number | null
          description?: string | null
          has_inventory?: string | null
          id?: string
          is_inventory_item?: string | null
          ispartofinventory?: string | null
          manufacturer?: string | null
          modelnumber?: string | null
          name?: string | null
          partcategory?: string | null
          partdescription?: string | null
          partid?: string | null
          partname?: string | null
          partnumber?: string | null
          parttype?: string | null
          price?: number | null
          quantity?: number | null
          quantityavailable?: number | null
          quantityinstock?: number | null
          related_to_inventory_item?: string | null
          stockedin?: string | null
          stored_in?: string | null
          storedin?: string | null
          storeid?: string | null
          storelocation?: string | null
          supplied_by?: string | null
          suppliedby?: string | null
          supplier?: string | null
          supplierid?: string | null
          supplierinfo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bikepart_associated_with_inventory_fkey"
            columns: ["associated_with_inventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikepart_belongs_to_store_fkey"
            columns: ["belongs_to_store"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikepart_has_inventory_fkey"
            columns: ["has_inventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikepart_is_inventory_item_fkey"
            columns: ["is_inventory_item"]
            isOneToOne: false
            referencedRelation: "inventoryitem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikepart_ispartofinventory_fkey"
            columns: ["ispartofinventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikepart_related_to_inventory_item_fkey"
            columns: ["related_to_inventory_item"]
            isOneToOne: false
            referencedRelation: "inventoryitem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikepart_stockedin_fkey"
            columns: ["stockedin"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikepart_stored_in_fkey"
            columns: ["stored_in"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikepart_storedin_fkey"
            columns: ["storedin"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikepart_supplied_by_fkey"
            columns: ["supplied_by"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikepart_suppliedby_fkey"
            columns: ["suppliedby"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      cpe: {
        Row: {
          belongstoserviceplan: string | null
          cpeid: string | null
          id: string
          model: string | null
          serialnumber: string | null
          type: string | null
        }
        Insert: {
          belongstoserviceplan?: string | null
          cpeid?: string | null
          id: string
          model?: string | null
          serialnumber?: string | null
          type?: string | null
        }
        Update: {
          belongstoserviceplan?: string | null
          cpeid?: string | null
          id?: string
          model?: string | null
          serialnumber?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cpe_belongstoserviceplan_fkey"
            columns: ["belongstoserviceplan"]
            isOneToOne: false
            referencedRelation: "serviceplan"
            referencedColumns: ["id"]
          },
        ]
      }
      cpemanagement: {
        Row: {
          businessname: string | null
          contactinfo: string | null
          id: string
          managementid: string | null
          manages: string | null
          provider: string | null
          servicelevelagreement: string | null
        }
        Insert: {
          businessname?: string | null
          contactinfo?: string | null
          id: string
          managementid?: string | null
          manages?: string | null
          provider?: string | null
          servicelevelagreement?: string | null
        }
        Update: {
          businessname?: string | null
          contactinfo?: string | null
          id?: string
          managementid?: string | null
          manages?: string | null
          provider?: string | null
          servicelevelagreement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cpemanagement_manages_fkey"
            columns: ["manages"]
            isOneToOne: false
            referencedRelation: "switch"
            referencedColumns: ["id"]
          },
        ]
      }
      customer: {
        Row: {
          contactinfo: string | null
          customerid: string | null
          hasserviceplan: string | null
          id: string
          name: string | null
        }
        Insert: {
          contactinfo?: string | null
          customerid?: string | null
          hasserviceplan?: string | null
          id: string
          name?: string | null
        }
        Update: {
          contactinfo?: string | null
          customerid?: string | null
          hasserviceplan?: string | null
          id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_hasserviceplan_fkey"
            columns: ["hasserviceplan"]
            isOneToOne: false
            referencedRelation: "serviceplan"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          associatedwithsupplier: string | null
          belongs_to_store: string | null
          belongstostore: string | null
          bikepartid: string | null
          contains: string | null
          containspart: string | null
          containsparts: string | null
          has_bike_part: string | null
          has_part_details: string | null
          has_supplier: string | null
          haspart: string | null
          haspartdetails: string | null
          hassuppliers: string | null
          id: string
          includesparts: string | null
          inventoryid: string | null
          islocatedat: string | null
          lastupdated: string | null
          located_at: string | null
          locatedat: string | null
          locatedin: string | null
          locationid: string | null
          maintains: string | null
          managedby: string | null
          partid: string | null
          partname: string | null
          partnumber: string | null
          price: number | null
          quantity: number | null
          related_parts: string | null
          sku: string | null
          storeid: string | null
          supplier: string | null
          tracked_parts: string | null
        }
        Insert: {
          associatedwithsupplier?: string | null
          belongs_to_store?: string | null
          belongstostore?: string | null
          bikepartid?: string | null
          contains?: string | null
          containspart?: string | null
          containsparts?: string | null
          has_bike_part?: string | null
          has_part_details?: string | null
          has_supplier?: string | null
          haspart?: string | null
          haspartdetails?: string | null
          hassuppliers?: string | null
          id: string
          includesparts?: string | null
          inventoryid?: string | null
          islocatedat?: string | null
          lastupdated?: string | null
          located_at?: string | null
          locatedat?: string | null
          locatedin?: string | null
          locationid?: string | null
          maintains?: string | null
          managedby?: string | null
          partid?: string | null
          partname?: string | null
          partnumber?: string | null
          price?: number | null
          quantity?: number | null
          related_parts?: string | null
          sku?: string | null
          storeid?: string | null
          supplier?: string | null
          tracked_parts?: string | null
        }
        Update: {
          associatedwithsupplier?: string | null
          belongs_to_store?: string | null
          belongstostore?: string | null
          bikepartid?: string | null
          contains?: string | null
          containspart?: string | null
          containsparts?: string | null
          has_bike_part?: string | null
          has_part_details?: string | null
          has_supplier?: string | null
          haspart?: string | null
          haspartdetails?: string | null
          hassuppliers?: string | null
          id?: string
          includesparts?: string | null
          inventoryid?: string | null
          islocatedat?: string | null
          lastupdated?: string | null
          located_at?: string | null
          locatedat?: string | null
          locatedin?: string | null
          locationid?: string | null
          maintains?: string | null
          managedby?: string | null
          partid?: string | null
          partname?: string | null
          partnumber?: string | null
          price?: number | null
          quantity?: number | null
          related_parts?: string | null
          sku?: string | null
          storeid?: string | null
          supplier?: string | null
          tracked_parts?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_associatedwithsupplier_fkey"
            columns: ["associatedwithsupplier"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_belongs_to_store_fkey"
            columns: ["belongs_to_store"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_belongstostore_fkey"
            columns: ["belongstostore"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_contains_fkey"
            columns: ["contains"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_containspart_fkey"
            columns: ["containspart"]
            isOneToOne: false
            referencedRelation: "part"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_containsparts_fkey"
            columns: ["containsparts"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_has_bike_part_fkey"
            columns: ["has_bike_part"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_has_part_details_fkey"
            columns: ["has_part_details"]
            isOneToOne: false
            referencedRelation: "partdetails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_has_supplier_fkey"
            columns: ["has_supplier"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_haspart_fkey"
            columns: ["haspart"]
            isOneToOne: false
            referencedRelation: "part"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_haspartdetails_fkey"
            columns: ["haspartdetails"]
            isOneToOne: false
            referencedRelation: "partdetails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_hassuppliers_fkey"
            columns: ["hassuppliers"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_includesparts_fkey"
            columns: ["includesparts"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_islocatedat_fkey"
            columns: ["islocatedat"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_located_at_fkey"
            columns: ["located_at"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_locatedat_fkey"
            columns: ["locatedat"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_locatedin_fkey"
            columns: ["locatedin"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_maintains_fkey"
            columns: ["maintains"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_managedby_fkey"
            columns: ["managedby"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_related_parts_fkey"
            columns: ["related_parts"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_tracked_parts_fkey"
            columns: ["tracked_parts"]
            isOneToOne: false
            referencedRelation: "part"
            referencedColumns: ["id"]
          },
        ]
      }
      inventoryitem: {
        Row: {
          associated_with_part: string | null
          belongs_to_store: string | null
          belongstostore: string | null
          category: string | null
          description: string | null
          has_part: string | null
          has_supplier: string | null
          hassuppliers: string | null
          id: string
          itemdescription: string | null
          itemid: string | null
          itemname: string | null
          locatedin: string | null
          location: string | null
          part_of_store: string | null
          price: number | null
          quantity: number | null
          quantityavailable: number | null
          stockedin: string | null
          store: string | null
          stored_in: string | null
          storeid: string | null
          suppliedby: string | null
          supplier: string | null
          supplierid: string | null
        }
        Insert: {
          associated_with_part?: string | null
          belongs_to_store?: string | null
          belongstostore?: string | null
          category?: string | null
          description?: string | null
          has_part?: string | null
          has_supplier?: string | null
          hassuppliers?: string | null
          id: string
          itemdescription?: string | null
          itemid?: string | null
          itemname?: string | null
          locatedin?: string | null
          location?: string | null
          part_of_store?: string | null
          price?: number | null
          quantity?: number | null
          quantityavailable?: number | null
          stockedin?: string | null
          store?: string | null
          stored_in?: string | null
          storeid?: string | null
          suppliedby?: string | null
          supplier?: string | null
          supplierid?: string | null
        }
        Update: {
          associated_with_part?: string | null
          belongs_to_store?: string | null
          belongstostore?: string | null
          category?: string | null
          description?: string | null
          has_part?: string | null
          has_supplier?: string | null
          hassuppliers?: string | null
          id?: string
          itemdescription?: string | null
          itemid?: string | null
          itemname?: string | null
          locatedin?: string | null
          location?: string | null
          part_of_store?: string | null
          price?: number | null
          quantity?: number | null
          quantityavailable?: number | null
          stockedin?: string | null
          store?: string | null
          stored_in?: string | null
          storeid?: string | null
          suppliedby?: string | null
          supplier?: string | null
          supplierid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventoryitem_associated_with_part_fkey"
            columns: ["associated_with_part"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_belongs_to_store_fkey"
            columns: ["belongs_to_store"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_belongstostore_fkey"
            columns: ["belongstostore"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_has_part_fkey"
            columns: ["has_part"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_has_supplier_fkey"
            columns: ["has_supplier"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_hassuppliers_fkey"
            columns: ["hassuppliers"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_locatedin_fkey"
            columns: ["locatedin"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_part_of_store_fkey"
            columns: ["part_of_store"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_stockedin_fkey"
            columns: ["stockedin"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_store_fkey"
            columns: ["store"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_stored_in_fkey"
            columns: ["stored_in"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_suppliedby_fkey"
            columns: ["suppliedby"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventoryitem_supplier_fkey"
            columns: ["supplier"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      networkdevice: {
        Row: {
          connectedtocpe: string | null
          deviceid: string | null
          devicetype: string | null
          id: string
          ipaddress: string | null
        }
        Insert: {
          connectedtocpe?: string | null
          deviceid?: string | null
          devicetype?: string | null
          id: string
          ipaddress?: string | null
        }
        Update: {
          connectedtocpe?: string | null
          deviceid?: string | null
          devicetype?: string | null
          id?: string
          ipaddress?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "networkdevice_connectedtocpe_fkey"
            columns: ["connectedtocpe"]
            isOneToOne: false
            referencedRelation: "cpe"
            referencedColumns: ["id"]
          },
        ]
      }
      part: {
        Row: {
          category: string | null
          cost: number | null
          description: string | null
          id: string
          included_in_inventory: string | null
          isininventory: string | null
          issuppliedby: string | null
          manufacturer: string | null
          name: string | null
          part_inventory: string | null
          partid: string | null
          partname: string | null
          price: number | null
          suppliedby: string | null
          supplier: string | null
          supplierid: string | null
          trackedin: string | null
          weight: number | null
        }
        Insert: {
          category?: string | null
          cost?: number | null
          description?: string | null
          id: string
          included_in_inventory?: string | null
          isininventory?: string | null
          issuppliedby?: string | null
          manufacturer?: string | null
          name?: string | null
          part_inventory?: string | null
          partid?: string | null
          partname?: string | null
          price?: number | null
          suppliedby?: string | null
          supplier?: string | null
          supplierid?: string | null
          trackedin?: string | null
          weight?: number | null
        }
        Update: {
          category?: string | null
          cost?: number | null
          description?: string | null
          id?: string
          included_in_inventory?: string | null
          isininventory?: string | null
          issuppliedby?: string | null
          manufacturer?: string | null
          name?: string | null
          part_inventory?: string | null
          partid?: string | null
          partname?: string | null
          price?: number | null
          suppliedby?: string | null
          supplier?: string | null
          supplierid?: string | null
          trackedin?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "part_included_in_inventory_fkey"
            columns: ["included_in_inventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_isininventory_fkey"
            columns: ["isininventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_issuppliedby_fkey"
            columns: ["issuppliedby"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_part_inventory_fkey"
            columns: ["part_inventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_suppliedby_fkey"
            columns: ["suppliedby"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_trackedin_fkey"
            columns: ["trackedin"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      partdetails: {
        Row: {
          description: string | null
          id: string
          is_part_of_inventory: string | null
          ispartofinventory: string | null
          manufacturer: string | null
          partdescription: string | null
          partid: string | null
          price: number | null
          warrantyperiod: string | null
        }
        Insert: {
          description?: string | null
          id: string
          is_part_of_inventory?: string | null
          ispartofinventory?: string | null
          manufacturer?: string | null
          partdescription?: string | null
          partid?: string | null
          price?: number | null
          warrantyperiod?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          is_part_of_inventory?: string | null
          ispartofinventory?: string | null
          manufacturer?: string | null
          partdescription?: string | null
          partid?: string | null
          price?: number | null
          warrantyperiod?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partdetails_is_part_of_inventory_fkey"
            columns: ["is_part_of_inventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partdetails_ispartofinventory_fkey"
            columns: ["ispartofinventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      phone: {
        Row: {
          connectedto: string | null
          id: string
          location: string | null
          macaddress: string | null
          model: string | null
          phoneid: string | null
        }
        Insert: {
          connectedto?: string | null
          id: string
          location?: string | null
          macaddress?: string | null
          model?: string | null
          phoneid?: string | null
        }
        Update: {
          connectedto?: string | null
          id?: string
          location?: string | null
          macaddress?: string | null
          model?: string | null
          phoneid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_connectedto_fkey"
            columns: ["connectedto"]
            isOneToOne: false
            referencedRelation: "switch"
            referencedColumns: ["id"]
          },
        ]
      }
      router: {
        Row: {
          connectedto: string | null
          id: string
          ipaddress: string | null
          location: string | null
          macaddress: string | null
          managedby: string | null
          model: string | null
          provider: string | null
          routerid: string | null
          status: string | null
        }
        Insert: {
          connectedto?: string | null
          id: string
          ipaddress?: string | null
          location?: string | null
          macaddress?: string | null
          managedby?: string | null
          model?: string | null
          provider?: string | null
          routerid?: string | null
          status?: string | null
        }
        Update: {
          connectedto?: string | null
          id?: string
          ipaddress?: string | null
          location?: string | null
          macaddress?: string | null
          managedby?: string | null
          model?: string | null
          provider?: string | null
          routerid?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "router_connectedto_fkey"
            columns: ["connectedto"]
            isOneToOne: false
            referencedRelation: "switch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "router_managedby_fkey"
            columns: ["managedby"]
            isOneToOne: false
            referencedRelation: "cpemanagement"
            referencedColumns: ["id"]
          },
        ]
      }
      serviceplan: {
        Row: {
          id: string
          includescpe: string | null
          monthlyfee: number | null
          planid: string | null
          planname: string | null
        }
        Insert: {
          id: string
          includescpe?: string | null
          monthlyfee?: number | null
          planid?: string | null
          planname?: string | null
        }
        Update: {
          id?: string
          includescpe?: string | null
          monthlyfee?: number | null
          planid?: string | null
          planname?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serviceplan_includescpe_fkey"
            columns: ["includescpe"]
            isOneToOne: false
            referencedRelation: "cpe"
            referencedColumns: ["id"]
          },
        ]
      }
      store: {
        Row: {
          address: string | null
          contactinfo: string | null
          contactnumber: string | null
          email: string | null
          has_bike_parts: string | null
          has_inventory: string | null
          has_parts: string | null
          hasbikeparts: string | null
          hasinventory: string | null
          hasparts: string | null
          holdsinventory: string | null
          id: string
          inventory: string | null
          location: string | null
          manager: string | null
          managername: string | null
          managesinventory: string | null
          name: string | null
          offers: string | null
          storeid: string | null
          storelocation: string | null
          storename: string | null
        }
        Insert: {
          address?: string | null
          contactinfo?: string | null
          contactnumber?: string | null
          email?: string | null
          has_bike_parts?: string | null
          has_inventory?: string | null
          has_parts?: string | null
          hasbikeparts?: string | null
          hasinventory?: string | null
          hasparts?: string | null
          holdsinventory?: string | null
          id: string
          inventory?: string | null
          location?: string | null
          manager?: string | null
          managername?: string | null
          managesinventory?: string | null
          name?: string | null
          offers?: string | null
          storeid?: string | null
          storelocation?: string | null
          storename?: string | null
        }
        Update: {
          address?: string | null
          contactinfo?: string | null
          contactnumber?: string | null
          email?: string | null
          has_bike_parts?: string | null
          has_inventory?: string | null
          has_parts?: string | null
          hasbikeparts?: string | null
          hasinventory?: string | null
          hasparts?: string | null
          holdsinventory?: string | null
          id?: string
          inventory?: string | null
          location?: string | null
          manager?: string | null
          managername?: string | null
          managesinventory?: string | null
          name?: string | null
          offers?: string | null
          storeid?: string | null
          storelocation?: string | null
          storename?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_has_bike_parts_fkey"
            columns: ["has_bike_parts"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_has_inventory_fkey"
            columns: ["has_inventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_has_parts_fkey"
            columns: ["has_parts"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_hasbikeparts_fkey"
            columns: ["hasbikeparts"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_hasinventory_fkey"
            columns: ["hasinventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_hasparts_fkey"
            columns: ["hasparts"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_holdsinventory_fkey"
            columns: ["holdsinventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_inventory_fkey"
            columns: ["inventory"]
            isOneToOne: false
            referencedRelation: "inventoryitem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_managesinventory_fkey"
            columns: ["managesinventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_offers_fkey"
            columns: ["offers"]
            isOneToOne: false
            referencedRelation: "telcoservice"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier: {
        Row: {
          address: string | null
          contactemail: string | null
          contactinfo: string | null
          contactinformation: string | null
          contactnumber: string | null
          contactperson: string | null
          email: string | null
          id: string
          inventoryitems: string | null
          name: string | null
          provides: string | null
          providesbikeparts: string | null
          providesparts: string | null
          supplierid: string | null
          suppliername: string | null
          supplies: string | null
          supplies_bike_parts: string | null
          supplies_inventory: string | null
          supplies_items: string | null
          supplies_parts: string | null
          suppliesinventory: string | null
          suppliesitems: string | null
          suppliespart: string | null
          suppliesparts: string | null
        }
        Insert: {
          address?: string | null
          contactemail?: string | null
          contactinfo?: string | null
          contactinformation?: string | null
          contactnumber?: string | null
          contactperson?: string | null
          email?: string | null
          id: string
          inventoryitems?: string | null
          name?: string | null
          provides?: string | null
          providesbikeparts?: string | null
          providesparts?: string | null
          supplierid?: string | null
          suppliername?: string | null
          supplies?: string | null
          supplies_bike_parts?: string | null
          supplies_inventory?: string | null
          supplies_items?: string | null
          supplies_parts?: string | null
          suppliesinventory?: string | null
          suppliesitems?: string | null
          suppliespart?: string | null
          suppliesparts?: string | null
        }
        Update: {
          address?: string | null
          contactemail?: string | null
          contactinfo?: string | null
          contactinformation?: string | null
          contactnumber?: string | null
          contactperson?: string | null
          email?: string | null
          id?: string
          inventoryitems?: string | null
          name?: string | null
          provides?: string | null
          providesbikeparts?: string | null
          providesparts?: string | null
          supplierid?: string | null
          suppliername?: string | null
          supplies?: string | null
          supplies_bike_parts?: string | null
          supplies_inventory?: string | null
          supplies_items?: string | null
          supplies_parts?: string | null
          suppliesinventory?: string | null
          suppliesitems?: string | null
          suppliespart?: string | null
          suppliesparts?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_inventoryitems_fkey"
            columns: ["inventoryitems"]
            isOneToOne: false
            referencedRelation: "inventoryitem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_provides_fkey"
            columns: ["provides"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_providesbikeparts_fkey"
            columns: ["providesbikeparts"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_providesparts_fkey"
            columns: ["providesparts"]
            isOneToOne: false
            referencedRelation: "part"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_supplies_bike_parts_fkey"
            columns: ["supplies_bike_parts"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_supplies_fkey"
            columns: ["supplies"]
            isOneToOne: false
            referencedRelation: "inventoryitem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_supplies_inventory_fkey"
            columns: ["supplies_inventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_supplies_items_fkey"
            columns: ["supplies_items"]
            isOneToOne: false
            referencedRelation: "inventoryitem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_supplies_parts_fkey"
            columns: ["supplies_parts"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_suppliesinventory_fkey"
            columns: ["suppliesinventory"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_suppliesitems_fkey"
            columns: ["suppliesitems"]
            isOneToOne: false
            referencedRelation: "inventoryitem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_suppliespart_fkey"
            columns: ["suppliespart"]
            isOneToOne: false
            referencedRelation: "part"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_suppliesparts_fkey"
            columns: ["suppliesparts"]
            isOneToOne: false
            referencedRelation: "bikepart"
            referencedColumns: ["id"]
          },
        ]
      }
      switch: {
        Row: {
          connectedto: string | null
          id: string
          ipaddress: string | null
          location: string | null
          macaddress: string | null
          managedby: string | null
          model: string | null
          partof: string | null
          provider: string | null
          status: string | null
          switchid: string | null
        }
        Insert: {
          connectedto?: string | null
          id: string
          ipaddress?: string | null
          location?: string | null
          macaddress?: string | null
          managedby?: string | null
          model?: string | null
          partof?: string | null
          provider?: string | null
          status?: string | null
          switchid?: string | null
        }
        Update: {
          connectedto?: string | null
          id?: string
          ipaddress?: string | null
          location?: string | null
          macaddress?: string | null
          managedby?: string | null
          model?: string | null
          partof?: string | null
          provider?: string | null
          status?: string | null
          switchid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "switch_connectedto_fkey"
            columns: ["connectedto"]
            isOneToOne: false
            referencedRelation: "router"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "switch_managedby_fkey"
            columns: ["managedby"]
            isOneToOne: false
            referencedRelation: "cpemanagement"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "switch_partof_fkey"
            columns: ["partof"]
            isOneToOne: false
            referencedRelation: "router"
            referencedColumns: ["id"]
          },
        ]
      }
      telcoservice: {
        Row: {
          id: string
          offeredon: string | null
          serviceid: string | null
          servicename: string | null
          servicetype: string | null
          status: string | null
        }
        Insert: {
          id: string
          offeredon?: string | null
          serviceid?: string | null
          servicename?: string | null
          servicetype?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          offeredon?: string | null
          serviceid?: string | null
          servicename?: string | null
          servicetype?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telcoservice_offeredon_fkey"
            columns: ["offeredon"]
            isOneToOne: false
            referencedRelation: "store"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  ai_osp_runtime: {
    Enums: {},
  },
  osp_metadata: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  smb_inventory: {
    Enums: {},
  },
} as const
