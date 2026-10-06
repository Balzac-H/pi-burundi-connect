export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      follows: {
        Row: {
          created_at: string;
          suiveur_id: string;
          suivi_id: string;
        };
        Insert: {
          created_at?: string;
          suiveur_id: string;
          suivi_id: string;
        };
        Update: {
          created_at?: string;
          suiveur_id?: string;
          suivi_id?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          categorie: string;
          created_at: string;
          description: string;
          duree: string | null;
          employeur_id: string;
          id: string;
          localisation: string;
          salaire: number | null;
          titre: string;
          updated_at: string;
          urgent: boolean;
        };
        Insert: {
          categorie?: string;
          created_at?: string;
          description?: string;
          duree?: string | null;
          employeur_id: string;
          id?: string;
          localisation?: string;
          salaire?: number | null;
          titre: string;
          updated_at?: string;
          urgent?: boolean;
        };
        Update: {
          categorie?: string;
          created_at?: string;
          description?: string;
          duree?: string | null;
          employeur_id?: string;
          id?: string;
          localisation?: string;
          salaire?: number | null;
          titre?: string;
          updated_at?: string;
          urgent?: boolean;
        };
        Relationships: [];
      };
      litiges: {
        Row: {
          auteur_id: string;
          created_at: string;
          description: string;
          id: string;
          order_id: string;
          statut: string;
        };
        Insert: {
          auteur_id: string;
          created_at?: string;
          description: string;
          id?: string;
          order_id: string;
          statut?: string;
        };
        Update: {
          auteur_id?: string;
          created_at?: string;
          description?: string;
          id?: string;
          order_id?: string;
          statut?: string;
        };
        Relationships: [
          {
            foreignKeyName: "litiges_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          contenu: string;
          created_at: string;
          destinataire_id: string;
          expediteur_id: string;
          id: string;
          lu: boolean;
        };
        Insert: {
          contenu: string;
          created_at?: string;
          destinataire_id: string;
          expediteur_id: string;
          id?: string;
          lu?: boolean;
        };
        Update: {
          contenu?: string;
          created_at?: string;
          destinataire_id?: string;
          expediteur_id?: string;
          id?: string;
          lu?: boolean;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          contenu: string | null;
          created_at: string;
          id: string;
          lien: string | null;
          lu: boolean;
          titre: string;
          user_id: string;
        };
        Insert: {
          contenu?: string | null;
          created_at?: string;
          id?: string;
          lien?: string | null;
          lu?: boolean;
          titre: string;
          user_id: string;
        };
        Update: {
          contenu?: string | null;
          created_at?: string;
          id?: string;
          lien?: string | null;
          lu?: boolean;
          titre?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          acheteur_id: string;
          created_at: string;
          id: string;
          montant: number;
          produit_id: string | null;
          quantite: number;
          recu_confirme: boolean;
          statut: string;
          titre: string;
          unite: string;
          updated_at: string;
          vendeur_id: string;
        };
        Insert: {
          acheteur_id: string;
          created_at?: string;
          id?: string;
          montant: number;
          produit_id?: string | null;
          quantite: number;
          recu_confirme?: boolean;
          statut?: string;
          titre: string;
          unite?: string;
          updated_at?: string;
          vendeur_id: string;
        };
        Update: {
          acheteur_id?: string;
          created_at?: string;
          id?: string;
          montant?: number;
          produit_id?: string | null;
          quantite?: number;
          recu_confirme?: boolean;
          statut?: string;
          titre?: string;
          unite?: string;
          updated_at?: string;
          vendeur_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_produit_id_fkey";
            columns: ["produit_id"];
            isOneToOne: false;
            referencedRelation: "produits";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          commission: number | null;
          created_at: string;
          facture: Json | null;
          id: string;
          montant: number;
          order_id: string;
          pi_payment_id: string;
          statut: string;
          txid: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          commission?: number | null;
          created_at?: string;
          facture?: Json | null;
          id?: string;
          montant: number;
          order_id: string;
          pi_payment_id: string;
          statut?: string;
          txid?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          commission?: number | null;
          created_at?: string;
          facture?: Json | null;
          id?: string;
          montant?: number;
          order_id?: string;
          pi_payment_id?: string;
          statut?: string;
          txid?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      produits: {
        Row: {
          categorie: string;
          created_at: string;
          description: string | null;
          id: string;
          lieu: string | null;
          livraison: string | null;
          photo_url: string | null;
          prix: number;
          publie: boolean;
          quantite_min: number;
          stock: number;
          titre: string;
          unite: string;
          updated_at: string;
          vendeur_id: string;
        };
        Insert: {
          categorie?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          lieu?: string | null;
          livraison?: string | null;
          photo_url?: string | null;
          prix?: number;
          publie?: boolean;
          quantite_min?: number;
          stock?: number;
          titre: string;
          unite?: string;
          updated_at?: string;
          vendeur_id: string;
        };
        Update: {
          categorie?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          lieu?: string | null;
          livraison?: string | null;
          photo_url?: string | null;
          prix?: number;
          publie?: boolean;
          quantite_min?: number;
          stock?: number;
          titre?: string;
          unite?: string;
          updated_at?: string;
          vendeur_id?: string;
        };
        Relationships: [];
      };
      profils: {
        Row: {
          bio: string | null;
          competences: string[];
          created_at: string;
          id: string;
          nom: string;
          photo_url: string | null;
          pi_uid: string | null;
          pi_username: string | null;
          prix_horaire: number | null;
          statut: string;
          telephone: string | null;
          theme: string | null;
          type_compte: string;
          updated_at: string;
          ville: string | null;
          whatsapp: string | null;
        };
        Insert: {
          bio?: string | null;
          competences?: string[];
          created_at?: string;
          id: string;
          nom?: string;
          photo_url?: string | null;
          pi_uid?: string | null;
          pi_username?: string | null;
          prix_horaire?: number | null;
          statut?: string;
          telephone?: string | null;
          theme?: string | null;
          type_compte?: string;
          updated_at?: string;
          ville?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          bio?: string | null;
          competences?: string[];
          created_at?: string;
          id?: string;
          nom?: string;
          photo_url?: string | null;
          pi_uid?: string | null;
          pi_username?: string | null;
          prix_horaire?: number | null;
          statut?: string;
          telephone?: string | null;
          theme?: string | null;
          type_compte?: string;
          updated_at?: string;
          ville?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      reglages: {
        Row: {
          cle: string;
          updated_at: string;
          valeur: Json;
        };
        Insert: {
          cle: string;
          updated_at?: string;
          valeur: Json;
        };
        Update: {
          cle?: string;
          updated_at?: string;
          valeur?: Json;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          auteur_id: string;
          commentaire: string | null;
          created_at: string;
          id: string;
          note: number;
          vendeur_id: string;
        };
        Insert: {
          auteur_id: string;
          commentaire?: string | null;
          created_at?: string;
          id?: string;
          note: number;
          vendeur_id: string;
        };
        Update: {
          auteur_id?: string;
          commentaire?: string | null;
          created_at?: string;
          id?: string;
          note?: number;
          vendeur_id?: string;
        };
        Relationships: [];
      };
      signalements: {
        Row: {
          auteur_id: string;
          cible_id: string;
          cible_type: string;
          created_at: string;
          details: string | null;
          id: string;
          raison: string;
          statut: string;
          utilisateur_signale_id: string;
        };
        Insert: {
          auteur_id: string;
          cible_id: string;
          cible_type: string;
          created_at?: string;
          details?: string | null;
          id?: string;
          raison: string;
          statut?: string;
          utilisateur_signale_id: string;
        };
        Update: {
          auteur_id?: string;
          cible_id?: string;
          cible_type?: string;
          created_at?: string;
          details?: string | null;
          id?: string;
          raison?: string;
          statut?: string;
          utilisateur_signale_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      profils_publics: {
        Row: {
          bio: string | null;
          competences: string[] | null;
          created_at: string | null;
          id: string | null;
          nom: string | null;
          photo_url: string | null;
          prix_horaire: number | null;
          statut: string | null;
          type_compte: string | null;
          ville: string | null;
        };
        Insert: {
          bio?: string | null;
          competences?: string[] | null;
          created_at?: string | null;
          id?: string | null;
          nom?: string | null;
          photo_url?: string | null;
          prix_horaire?: number | null;
          statut?: string | null;
          type_compte?: string | null;
          ville?: string | null;
        };
        Update: {
          bio?: string | null;
          competences?: string[] | null;
          created_at?: string | null;
          id?: string | null;
          nom?: string | null;
          photo_url?: string | null;
          prix_horaire?: number | null;
          statut?: string | null;
          type_compte?: string | null;
          ville?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      confirmer_reception: { Args: { _order: string }; Returns: undefined };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      utilisateurs_verifies: { Args: { _ids: string[] }; Returns: string[] };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const;
