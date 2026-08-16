CREATE TABLE "audit_chain_head" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "derniere_empreinte" TEXT,
  CONSTRAINT "audit_chain_head_pkey" PRIMARY KEY ("id")
);

INSERT INTO "audit_chain_head" ("id", "derniere_empreinte") VALUES ('default', NULL);

CREATE INDEX "audit_log_horodatage_idx" ON "audit_log"("horodatage");
