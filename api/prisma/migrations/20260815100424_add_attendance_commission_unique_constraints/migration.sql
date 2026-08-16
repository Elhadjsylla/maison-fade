ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_date_key" UNIQUE ("user_id", "date");
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_user_id_periode_key" UNIQUE ("user_id", "periode");
