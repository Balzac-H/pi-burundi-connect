export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          acteur: string | null;
          cible: string | null;
          date: string;
          detail: Json;
          id: string;
        };
        Insert: {
          action: string;
          acteur?: string | null;
          cible?: string | null;
          date?: string;
          detail?: Json;
          id?: string;
        };
        Update: {
          action?: string;
          acteur?: string | null;
          cible?: string | null;
          date?: string;
          detail?: Json;
          id?: string;
        };
        Relationships: [];
      };
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
      liberations_en_attente: {
        Row: {
          created_at: string;
          id: string;
          montant: number;
          payment_id: string;
          premier_admin: string;
          second_admin: string | null;
          statut: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          montant: number;
          payment_id: string;
          premier_admin: string;
          second_admin?: string | null;
          statut?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          montant?: number;
          payment_id?: string;
          premier_admin?: string;
          second_admin?: string | null;
          statut?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "liberations_en_attente_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: true;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
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
      order_items: {
        Row: {
          created_at: string;
          id: string;
          montant: number;
          order_id: string;
          prix_unitaire: number;
          produit_id: string | null;
          quantite: number;
          titre: string;
          unite: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          montant: number;
          order_id: string;
          prix_unitaire: number;
          produit_id?: string | null;
          quantite: number;
          titre: string;
          unite?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          montant?: number;
          order_id?: string;
          prix_unitaire?: number;
          produit_id?: string | null;
          quantite?: number;
          titre?: string;
          unite?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_produit_id_fkey";
            columns: ["produit_id"];
            isOneToOne: false;
            referencedRelation: "produits";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          acheteur_id: string;
          created_at: string;
          id: string;
          livre_declare_at: string | null;
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
          livre_declare_at?: string | null;
          montant?: number;
          produit_id?: string | null;
          quantite: number;
          recu_confirme?: boolean;
          statut?: string;
          titre?: string;
          unite?: string;
          updated_at?: string;
          vendeur_id?: string;
        };
        Update: {
          acheteur_id?: string;
          created_at?: string;
          id?: string;
          livre_declare_at?: string | null;
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
          a_rembourser: boolean;
          commission: number | null;
          created_at: string;
          facture: Json | null;
          id: string;
          montant: number;
          order_id: string;
          paid_held_at: string | null;
          pi_payment_id: string;
          rembourse_le: string | null;
          rembourse_par: string | null;
          statut: string;
          txid: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          a_rembourser?: boolean;
          commission?: number | null;
          created_at?: string;
          facture?: Json | null;
          id?: string;
          montant: number;
          order_id: string;
          paid_held_at?: string | null;
          pi_payment_id: string;
          rembourse_le?: string | null;
          rembourse_par?: string | null;
          statut?: string;
          txid?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          a_rembourser?: boolean;
          commission?: number | null;
          created_at?: string;
          facture?: Json | null;
          id?: string;
          montant?: number;
          order_id?: string;
          paid_held_at?: string | null;
          pi_payment_id?: string;
          rembourse_le?: string | null;
          rembourse_par?: string | null;
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
          vendeur_actif: boolean;
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
          vendeur_actif?: boolean;
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
          vendeur_actif?: boolean;
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
          order_id: string | null;
          vendeur_id: string;
        };
        Insert: {
          auteur_id: string;
          commentaire?: string | null;
          created_at?: string;
          id?: string;
          note: number;
          order_id?: string | null;
          vendeur_id: string;
        };
        Update: {
          auteur_id?: string;
          commentaire?: string | null;
          created_at?: string;
          id?: string;
          note?: number;
          order_id?: string | null;
          vendeur_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_vendeur_id_fkey";
            columns: ["vendeur_id"];
            isOneToOne: false;
            referencedRelation: "profils";
            referencedColumns: ["id"];
          },
        ];
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
      clients_vendeur: {
        Row: {
          acheteur_id: string | null;
          derniere_commande: string | null;
          nb_commandes: number | null;
          total: number | null;
          vendeur_id: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      gains_lignes: {
        Row: {
          commission: number | null;
          commission_payee: number | null;
          created_at: string | null;
          en_escrow: number | null;
          libere_brut: number | null;
          libere_net: number | null;
          livre_declare_at: string | null;
          montant: number | null;
          order_id: string | null;
          paiement_statut: string | null;
          quantite: number | null;
          statut: string | null;
          titre: string | null;
          unite: string | null;
          vendeur_id: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      gains_totaux: {
        Row: {
          commission_payee: number | null;
          en_escrow: number | null;
          libere_brut: number | null;
          libere_net: number | null;
          vendeur_id: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
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
      reviews_publics: {
        Row: {
          auteur_id: string | null;
          commentaire: string | null;
          created_at: string | null;
          id: string | null;
          note: number | null;
          vendeur_id: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Functions: {
      annuler_commandes_perimees: { Args: Record<string, never>; Returns: number };
      commande_a_litige: { Args: { _order: string }; Returns: boolean };
      decrementer_stock: { Args: { _produit: string; _qte: number }; Returns: boolean };
      declarer_livraison: { Args: { _order: string }; Returns: undefined };
      ecrire_audit: {
        Args: {
          _action: string;
          _acteur: string | null;
          _cible?: string | null;
          _detail?: Json;
        };
        Returns: undefined;
      };
      parties_commande_litigiee: { Args: { _a: string; _b: string }; Returns: boolean };
      refuser_conflit_interet: {
        Args: { _acheteur: string; _acteur: string; _vendeur: string };
        Returns: undefined;
      };
      traiter_litige: { Args: { _litige: string; _statut: string }; Returns: undefined };
      confirmer_reception: { Args: { _order: string }; Returns: undefined };
      creer_commandes: {
        Args: { _lignes: Json };
        Returns: Database["public"]["Tables"]["orders"]["Row"][];
      };
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
