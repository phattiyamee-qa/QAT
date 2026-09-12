-- CreateEnum
CREATE TYPE "CreatedFrom" AS ENUM ('sheet', 'site');

-- CreateEnum
CREATE TYPE "Phase" AS ENUM ('UAT', 'LIVE');

-- CreateEnum
CREATE TYPE "FieldSource" AS ENUM ('sheet', 'site_override');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('QA', 'PM');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('QA', 'PM', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OverrideStatus" AS ENUM ('UAT', 'LIVE', 'DONE', 'SKIPPED');

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT,
    "remark" TEXT,
    "created_from" "CreatedFrom" NOT NULL DEFAULT 'sheet',
    "sheet_row_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "phase" "Phase" NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "source" "FieldSource" NOT NULL DEFAULT 'sheet',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment" (
    "project_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "role_on_project" "ProjectRole" NOT NULL,

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("project_id","person_id","role_on_project")
);

-- CreateTable
CREATE TABLE "person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "google_sub" TEXT,
    "auth_user_id" UUID,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "person_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("person_id","role")
);

-- CreateTable
CREATE TABLE "status_override" (
    "project_id" TEXT NOT NULL,
    "status" "OverrideStatus" NOT NULL,
    "set_by" TEXT,
    "set_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_override_pkey" PRIMARY KEY ("project_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_sheet_row_ref_key" ON "project"("sheet_row_ref");

-- CreateIndex
CREATE UNIQUE INDEX "period_project_id_phase_key" ON "period"("project_id", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "person_email_key" ON "person"("email");

-- CreateIndex
CREATE UNIQUE INDEX "person_google_sub_key" ON "person"("google_sub");

-- CreateIndex
CREATE UNIQUE INDEX "person_auth_user_id_key" ON "person"("auth_user_id");

-- AddForeignKey
ALTER TABLE "period" ADD CONSTRAINT "period_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_override" ADD CONSTRAINT "status_override_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
