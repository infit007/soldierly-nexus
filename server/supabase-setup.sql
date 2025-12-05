-- Supabase Database Setup Script
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql/new

-- Create Role enum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'MANAGER');

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "army_number" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS "user_profiles" (
    "user_id" TEXT NOT NULL,
    "personal_details" JSONB,
    "family" JSONB,
    "education" JSONB,
    "medical" JSONB,
    "others" JSONB,
    "leave" JSONB,
    "salary" JSONB,
    "documents" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- Create requests table
CREATE TABLE IF NOT EXISTS "requests" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requester_id" TEXT NOT NULL,
    "admin_remark" TEXT,
    "manager_response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_army_number_key" ON "users"("army_number") WHERE "army_number" IS NOT NULL;

-- Create foreign keys
ALTER TABLE "user_profiles" 
    DROP CONSTRAINT IF EXISTS "user_profiles_user_id_fkey",
    ADD CONSTRAINT "user_profiles_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "requests" 
    DROP CONSTRAINT IF EXISTS "requests_requester_id_fkey",
    ADD CONSTRAINT "requests_requester_id_fkey" 
    FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Disable Row Level Security since we're using service key which bypasses RLS
-- Service key automatically bypasses RLS, so we don't need policies
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "requests" DISABLE ROW LEVEL SECURITY;

