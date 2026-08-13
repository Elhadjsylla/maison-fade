-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'gerant', 'coiffeur');

-- CreateEnum
CREATE TYPE "PermissionValeur" AS ENUM ('oui', 'non', 'limite');

-- CreateEnum
CREATE TYPE "TicketStatut" AS ENUM ('ouvert', 'paye', 'annule', 'rembourse');

-- CreateEnum
CREATE TYPE "PaymentStatut" AS ENUM ('created', 'pending', 'processing', 'succeeded', 'failed', 'expired', 'cancelled', 'refund_pending', 'refunded', 'partially_refunded');

-- CreateEnum
CREATE TYPE "AppointmentStatut" AS ENUM ('a_venir', 'attente_sur_place', 'en_cours', 'termine', 'encaisse', 'annule', 'absent');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('entree', 'sortie', 'inventaire', 'perte');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('gain', 'echange', 'ajustement', 'annulation');

-- CreateEnum
CREATE TYPE "CommissionStatut" AS ENUM ('due', 'versee');

-- CreateTable
CREATE TABLE "salons" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "tagline" TEXT,
    "tel" TEXT,
    "adresse" TEXT,
    "fauteuils" INTEGER NOT NULL DEFAULT 1,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "fuseau" TEXT NOT NULL DEFAULT 'Africa/Dakar',
    "logo_url" TEXT,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "salons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "salon_id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "pin_hash" TEXT,
    "password_hash" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dernier_acces" TIMESTAMP(3),
    "echecs_connexion" INTEGER NOT NULL DEFAULT 0,
    "verrouille_jusqua" TIMESTAMP(3),
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "cle_permission" TEXT NOT NULL,
    "valeur" "PermissionValeur" NOT NULL DEFAULT 'non',
    "plafond" INTEGER,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "empreinte" TEXT NOT NULL,
    "refresh_token_hash" TEXT,
    "approuve" BOOLEAN NOT NULL DEFAULT false,
    "approuve_par" TEXT,
    "derniere_utilisation" TIMESTAMP(3),
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "user_id" TEXT NOT NULL,
    "specialite" TEXT,
    "objectif_mensuel" INTEGER,
    "taux_commission" INTEGER NOT NULL DEFAULT 15,
    "date_entree" TIMESTAMP(3),
    "note_moyenne" DOUBLE PRECISION,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "heure_arrivee" TIMESTAMP(3),
    "heure_depart" TIMESTAMP(3),
    "pauses" JSONB,
    "retard_min" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'app',

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "emoji" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "categorie_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prix" INTEGER NOT NULL,
    "duree_min" INTEGER NOT NULL,
    "prix_variable" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "visible_en_ligne" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT,
    "prix_achat" INTEGER,
    "prix_vente" INTEGER,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "seuil_bas" INTEGER NOT NULL DEFAULT 10,
    "seuil_critique" INTEGER NOT NULL DEFAULT 3,
    "fournisseur" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_products" (
    "service_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantite_consommee" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "service_products_pkey" PRIMARY KEY ("service_id","product_id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "notes" TEXT,
    "preferences" JSONB,
    "coiffeur_prefere" TEXT,
    "consentement_sms" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_accounts" (
    "client_id" TEXT NOT NULL,
    "numero_carte" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "palier" TEXT NOT NULL DEFAULT 'bronze',
    "total_depense" INTEGER NOT NULL DEFAULT 0,
    "derniere_visite" TIMESTAMP(3),

    CONSTRAINT "loyalty_accounts_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "auteur_id" TEXT,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "service_id" TEXT NOT NULL,
    "coiffeur_id" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "statut" "AppointmentStatut" NOT NULL DEFAULT 'a_venir',
    "source" TEXT NOT NULL DEFAULT 'salon',
    "note" TEXT,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_sessions" (
    "id" TEXT NOT NULL,
    "salon_id" TEXT NOT NULL,
    "ouvert_par" TEXT NOT NULL,
    "ouvert_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fond_caisse" INTEGER NOT NULL,
    "ferme_par" TEXT,
    "ferme_le" TIMESTAMP(3),
    "total_attendu" INTEGER,
    "total_compte" INTEGER,
    "ecart" INTEGER,
    "motif_ecart" TEXT,

    CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "session_id" TEXT NOT NULL,
    "client_id" TEXT,
    "coiffeur_id" TEXT NOT NULL,
    "encaisse_par" TEXT NOT NULL,
    "sous_total" INTEGER NOT NULL,
    "remise_montant" INTEGER NOT NULL DEFAULT 0,
    "remise_motif" TEXT,
    "total" INTEGER NOT NULL,
    "statut" "TicketStatut" NOT NULL DEFAULT 'ouvert',
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paye_le" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_items" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "service_id" TEXT,
    "product_id" TEXT,
    "libelle" TEXT NOT NULL,
    "prix_unitaire" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "total" INTEGER NOT NULL,

    CONSTRAINT "ticket_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "methode" TEXT NOT NULL,
    "provider" TEXT,
    "provider_ref" TEXT,
    "montant" INTEGER NOT NULL,
    "frais" INTEGER NOT NULL DEFAULT 0,
    "statut" "PaymentStatut" NOT NULL DEFAULT 'created',
    "initie_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirme_le" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "event_id_provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "charge_utile" JSONB NOT NULL,
    "signature_valide" BOOLEAN NOT NULL,
    "recu_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantite" INTEGER NOT NULL,
    "ticket_id" TEXT,
    "auteur_id" TEXT,
    "motif" TEXT,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "base_ca" INTEGER NOT NULL,
    "taux" INTEGER NOT NULL,
    "montant" INTEGER NOT NULL,
    "statut" "CommissionStatut" NOT NULL DEFAULT 'due',
    "verse_le" TIMESTAMP(3),

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "coiffeur_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "publie_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "auteur_id" TEXT,
    "action" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entite_id" TEXT,
    "avant" JSONB,
    "apres" JSONB,
    "ip" TEXT,
    "device_id" TEXT,
    "horodatage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empreinte" TEXT NOT NULL,
    "empreinte_precedente" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "cle" TEXT NOT NULL,
    "valeur" JSONB NOT NULL,
    "salon_id" TEXT,
    "modifie_par" TEXT,
    "modifie_le" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("cle")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "destinataire_role" "Role",
    "destinataire_user_id" TEXT,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "corps" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_cle_permission_key" ON "role_permissions"("role", "cle_permission");

-- CreateIndex
CREATE UNIQUE INDEX "devices_empreinte_key" ON "devices"("empreinte");

-- CreateIndex
CREATE UNIQUE INDEX "clients_telephone_key" ON "clients"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_accounts_numero_carte_key" ON "loyalty_accounts"("numero_carte");

-- CreateIndex
CREATE INDEX "appointments_coiffeur_id_debut_idx" ON "appointments"("coiffeur_id", "debut");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_numero_key" ON "tickets"("numero");

-- CreateIndex
CREATE INDEX "tickets_paye_le_idx" ON "tickets"("paye_le");

-- CreateIndex
CREATE INDEX "payments_statut_initie_le_idx" ON "payments"("statut", "initie_le");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_event_id_provider_key" ON "payment_events"("event_id_provider");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "salons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_approuve_par_fkey" FOREIGN KEY ("approuve_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_products" ADD CONSTRAINT "service_products_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_products" ADD CONSTRAINT "service_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_coiffeur_prefere_fkey" FOREIGN KEY ("coiffeur_prefere") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_coiffeur_id_fkey" FOREIGN KEY ("coiffeur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "salons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_ouvert_par_fkey" FOREIGN KEY ("ouvert_par") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_ferme_par_fkey" FOREIGN KEY ("ferme_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "cash_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_coiffeur_id_fkey" FOREIGN KEY ("coiffeur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_encaisse_par_fkey" FOREIGN KEY ("encaisse_par") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_coiffeur_id_fkey" FOREIGN KEY ("coiffeur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "salons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_modifie_par_fkey" FOREIGN KEY ("modifie_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_destinataire_user_id_fkey" FOREIGN KEY ("destinataire_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

