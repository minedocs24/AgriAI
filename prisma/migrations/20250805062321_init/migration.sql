-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "public"."user_type_enum" AS ENUM ('PUBLIC', 'MEMBER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."subscription_tier_enum" AS ENUM ('BASIC', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."conversation_status_enum" AS ENUM ('ACTIVE', 'ARCHIVED', 'FLAGGED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."message_sender_enum" AS ENUM ('USER', 'AI', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."message_type_enum" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'SYSTEM_NOTIFICATION');

-- CreateEnum
CREATE TYPE "public"."document_type_enum" AS ENUM ('FILE', 'URL', 'TEXT');

-- CreateEnum
CREATE TYPE "public"."document_status_enum" AS ENUM ('DRAFT', 'PROCESSING', 'PUBLISHED', 'ARCHIVED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."access_level_enum" AS ENUM ('PUBLIC', 'MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."extraction_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."indexing_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."extraction_method_enum" AS ENUM ('MANUAL', 'AUTOMATIC', 'AI_GENERATED');

-- CreateEnum
CREATE TYPE "public"."feedback_type_enum" AS ENUM ('POSITIVE', 'NEGATIVE', 'REPORT');

-- CreateEnum
CREATE TYPE "public"."consent_type_enum" AS ENUM ('NECESSARY', 'ANALYTICS', 'MARKETING', 'PERSONALIZATION', 'DATA_SHARING');

-- CreateEnum
CREATE TYPE "public"."legal_basis_enum" AS ENUM ('CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS');

-- CreateEnum
CREATE TYPE "public"."data_request_type_enum" AS ENUM ('EXPORT', 'DELETION', 'PORTABILITY', 'RECTIFICATION');

-- CreateEnum
CREATE TYPE "public"."request_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "website_url" TEXT,
    "logo_url" TEXT,
    "address" JSONB,
    "contact_info" JSONB,
    "subscription_tier" "public"."subscription_tier_enum" NOT NULL DEFAULT 'BASIC',
    "subscription_expires_at" TIMESTAMPTZ,
    "max_users" INTEGER NOT NULL DEFAULT 10,
    "max_documents" INTEGER NOT NULL DEFAULT 100,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "user_type" "public"."user_type_enum" NOT NULL DEFAULT 'PUBLIC',
    "organization_id" UUID,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verification_token" TEXT,
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMPTZ,
    "last_login_at" TIMESTAMPTZ,
    "last_active_at" TIMESTAMPTZ,
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "profile_image_url" TEXT,
    "bio" TEXT,
    "location" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "language" VARCHAR(10) NOT NULL DEFAULT 'it',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Europe/Rome',
    "notifications" JSONB NOT NULL DEFAULT '{"email": true, "push": true, "sms": false}',
    "ai_settings" JSONB NOT NULL DEFAULT '{"response_length": "standard", "technical_level": "intermediate"}',
    "ui_preferences" JSONB NOT NULL DEFAULT '{"theme": "light", "density": "comfortable"}',
    "privacy_settings" JSONB NOT NULL DEFAULT '{"data_sharing": false, "analytics": true}',
    "communication_preferences" JSONB NOT NULL DEFAULT '{"newsletter": true, "updates": true}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "session_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "device_info" JSONB,
    "ip_address" INET,
    "location_info" JSONB,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "last_accessed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "icon" VARCHAR(50),
    "color" VARCHAR(7),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "access_level" "public"."access_level_enum" NOT NULL DEFAULT 'PUBLIC',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255),
    "status" "public"."conversation_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "context" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "avg_confidence" DECIMAL(4,3),
    "last_message_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "archived_at" TIMESTAMPTZ,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "sender" "public"."message_sender_enum" NOT NULL,
    "message_type" "public"."message_type_enum" NOT NULL DEFAULT 'TEXT',
    "tokens" INTEGER,
    "processing_time_ms" INTEGER,
    "model_used" VARCHAR(100),
    "confidence" DECIMAL(4,3),
    "intent_classification" JSONB,
    "language_detected" VARCHAR(10),
    "sentiment_score" DECIMAL(3,2),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "content_type" "public"."document_type_enum" NOT NULL,
    "category_id" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "author" VARCHAR(255),
    "source_url" TEXT,
    "file_path" TEXT,
    "file_size_bytes" BIGINT,
    "file_mime_type" VARCHAR(100),
    "language" VARCHAR(10) NOT NULL DEFAULT 'it',
    "status" "public"."document_status_enum" NOT NULL DEFAULT 'DRAFT',
    "access_level" "public"."access_level_enum" NOT NULL DEFAULT 'PUBLIC',
    "version" INTEGER NOT NULL DEFAULT 1,
    "checksum_md5" VARCHAR(32),
    "extraction_status" "public"."extraction_status_enum" NOT NULL DEFAULT 'PENDING',
    "indexing_status" "public"."indexing_status_enum" NOT NULL DEFAULT 'PENDING',
    "content_extracted" TEXT,
    "page_count" INTEGER,
    "word_count" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "processing_logs" JSONB NOT NULL DEFAULT '[]',
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "relevant_section" TEXT,
    "confidence" DECIMAL(4,3) NOT NULL,
    "chunk_index" INTEGER,
    "similarity_score" DECIMAL(8,7),
    "citation_text" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."keywords" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "keyword" VARCHAR(100) NOT NULL,
    "normalized" VARCHAR(100) NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "category_affinity" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_keywords" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "keyword_id" UUID NOT NULL,
    "relevance_score" DECIMAL(4,3) NOT NULL DEFAULT 1.0,
    "extraction_method" "public"."extraction_method_enum" NOT NULL DEFAULT 'MANUAL',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category_keywords" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "keyword_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_analysis" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "summary" TEXT,
    "extracted_entities" JSONB NOT NULL DEFAULT '[]',
    "topics" JSONB NOT NULL DEFAULT '[]',
    "readability_score" DECIMAL(4,2),
    "complexity_score" DECIMAL(4,2),
    "confidence" DECIMAL(4,3),
    "language_confidence" DECIMAL(4,3),
    "processing_model" VARCHAR(100),
    "processing_time_ms" INTEGER,
    "token_count" INTEGER,
    "correlations" JSONB NOT NULL DEFAULT '[]',
    "quality_metrics" JSONB NOT NULL DEFAULT '{}',
    "rag_optimization" JSONB NOT NULL DEFAULT '{}',
    "retrieval_keywords" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_embeddings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL DEFAULT 0,
    "chunk_text" TEXT NOT NULL,
    "chunk_start_char" INTEGER,
    "chunk_end_char" INTEGER,
    "embedding_model" VARCHAR(100) NOT NULL,
    "embedding" vector(1536),
    "embedding_version" INTEGER NOT NULL DEFAULT 1,
    "token_count" INTEGER,
    "chunk_metadata" JSONB NOT NULL DEFAULT '{}',
    "retrieval_score" DECIMAL(5,4),
    "context_window" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."query_embeddings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "query_hash" VARCHAR(64) NOT NULL,
    "query_text" TEXT NOT NULL,
    "embedding_model" VARCHAR(100) NOT NULL,
    "embedding" vector(1536),
    "usage_count" INTEGER NOT NULL DEFAULT 1,
    "avg_confidence" DECIMAL(4,3),
    "avg_retrieval_score" DECIMAL(4,3),
    "successful_rag_responses" INTEGER NOT NULL DEFAULT 0,
    "intent_classification" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "feedback_type" "public"."feedback_type_enum" NOT NULL,
    "rating" SMALLINT,
    "comment" TEXT,
    "improvement_suggestions" JSONB,
    "helpful_sources" UUID[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "message_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversation_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_consents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "consent_type" "public"."consent_type_enum" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "consent_date" TIMESTAMPTZ NOT NULL,
    "consent_source" VARCHAR(100),
    "ip_address" INET,
    "user_agent" TEXT,
    "legal_basis" "public"."legal_basis_enum",
    "withdrawn_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_export_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "request_type" "public"."data_request_type_enum" NOT NULL,
    "status" "public"."request_status_enum" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,
    "processed_by" UUID,
    "export_file_path" TEXT,
    "expiry_date" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(50),
    "resource_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "session_id" UUID,
    "details" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "public"."organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_slug" ON "public"."organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_subscription" ON "public"."organizations"("subscription_tier", "subscription_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_users_type_org" ON "public"."users"("user_type", "organization_id");

-- CreateIndex
CREATE INDEX "idx_users_last_active" ON "public"."users"("last_active_at");

-- CreateIndex
CREATE INDEX "idx_users_organization" ON "public"."users"("organization_id");

-- CreateIndex
CREATE INDEX "idx_users_active_email" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "public"."user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_token_key" ON "public"."user_sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_key" ON "public"."user_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "idx_user_sessions_token" ON "public"."user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "idx_user_sessions_user" ON "public"."user_sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "idx_user_sessions_cleanup" ON "public"."user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "idx_sessions_active" ON "public"."user_sessions"("session_token", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE INDEX "idx_categories_slug" ON "public"."categories"("slug");

-- CreateIndex
CREATE INDEX "idx_categories_parent" ON "public"."categories"("parent_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_categories_access" ON "public"."categories"("access_level", "is_active");

-- CreateIndex
CREATE INDEX "idx_conversations_user_created" ON "public"."conversations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_conversations_status" ON "public"."conversations"("status", "last_message_at");

-- CreateIndex
CREATE INDEX "idx_conversations_flagged" ON "public"."conversations"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_conversations_user_activity" ON "public"."conversations"("user_id", "last_message_at", "status");

-- CreateIndex
CREATE INDEX "idx_messages_conversation" ON "public"."messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_messages_sender_type" ON "public"."messages"("sender", "message_type");

-- CreateIndex
CREATE INDEX "idx_messages_confidence" ON "public"."messages"("confidence");

-- CreateIndex
CREATE INDEX "idx_messages_conversation_confidence" ON "public"."messages"("conversation_id", "confidence", "created_at");

-- CreateIndex
CREATE INDEX "idx_documents_category_status" ON "public"."documents"("category_id", "status", "published_at");

-- CreateIndex
CREATE INDEX "idx_documents_uploader" ON "public"."documents"("uploaded_by", "created_at");

-- CreateIndex
CREATE INDEX "idx_documents_status" ON "public"."documents"("status", "extraction_status", "indexing_status");

-- CreateIndex
CREATE INDEX "idx_documents_access" ON "public"."documents"("access_level", "status");

-- CreateIndex
CREATE INDEX "idx_documents_category_access_published" ON "public"."documents"("category_id", "access_level", "published_at");

-- CreateIndex
CREATE INDEX "idx_documents_public_search" ON "public"."documents"("category_id", "published_at");

-- CreateIndex
CREATE INDEX "idx_documents_analytics" ON "public"."documents"("category_id", "status", "created_at", "uploaded_by");

-- CreateIndex
CREATE INDEX "idx_message_sources_message" ON "public"."message_sources"("message_id");

-- CreateIndex
CREATE INDEX "idx_message_sources_document" ON "public"."message_sources"("document_id", "confidence");

-- CreateIndex
CREATE INDEX "idx_message_sources_confidence" ON "public"."message_sources"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "keywords_keyword_key" ON "public"."keywords"("keyword");

-- CreateIndex
CREATE INDEX "idx_keywords_normalized" ON "public"."keywords"("normalized");

-- CreateIndex
CREATE INDEX "idx_keywords_frequency" ON "public"."keywords"("frequency");

-- CreateIndex
CREATE INDEX "idx_document_keywords_document" ON "public"."document_keywords"("document_id", "relevance_score");

-- CreateIndex
CREATE INDEX "idx_document_keywords_keyword" ON "public"."document_keywords"("keyword_id", "relevance_score");

-- CreateIndex
CREATE UNIQUE INDEX "document_keywords_document_id_keyword_id_key" ON "public"."document_keywords"("document_id", "keyword_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_keywords_category_id_keyword_id_key" ON "public"."category_keywords"("category_id", "keyword_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_analysis_document_id_key" ON "public"."document_analysis"("document_id");

-- CreateIndex
CREATE INDEX "idx_document_analysis_confidence" ON "public"."document_analysis"("confidence");

-- CreateIndex
CREATE INDEX "idx_document_analysis_quality" ON "public"."document_analysis"("readability_score", "complexity_score");

-- CreateIndex
CREATE INDEX "idx_document_embeddings_document" ON "public"."document_embeddings"("document_id", "chunk_index");

-- CreateIndex
CREATE INDEX "idx_document_embeddings_model" ON "public"."document_embeddings"("embedding_model", "embedding_version");

-- CreateIndex
CREATE UNIQUE INDEX "document_embeddings_document_id_chunk_index_embedding_model_key" ON "public"."document_embeddings"("document_id", "chunk_index", "embedding_model");

-- CreateIndex
CREATE UNIQUE INDEX "query_embeddings_query_hash_key" ON "public"."query_embeddings"("query_hash");

-- CreateIndex
CREATE INDEX "idx_query_embeddings_usage" ON "public"."query_embeddings"("usage_count", "last_used_at");

-- CreateIndex
CREATE INDEX "idx_message_feedback_message" ON "public"."message_feedback"("message_id");

-- CreateIndex
CREATE INDEX "idx_message_feedback_type" ON "public"."message_feedback"("feedback_type", "created_at");

-- CreateIndex
CREATE INDEX "idx_message_feedback_type_period" ON "public"."message_feedback"("feedback_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "message_feedback_message_id_user_id_key" ON "public"."message_feedback"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_action" ON "public"."audit_logs"("user_id", "action", "created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_resource" ON "public"."audit_logs"("resource_type", "resource_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action_time" ON "public"."audit_logs"("action", "created_at");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_sources" ADD CONSTRAINT "message_sources_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_sources" ADD CONSTRAINT "message_sources_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_keywords" ADD CONSTRAINT "document_keywords_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_keywords" ADD CONSTRAINT "document_keywords_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_keywords" ADD CONSTRAINT "category_keywords_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_keywords" ADD CONSTRAINT "category_keywords_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_analysis" ADD CONSTRAINT "document_analysis_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_embeddings" ADD CONSTRAINT "document_embeddings_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_feedback" ADD CONSTRAINT "message_feedback_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_feedback" ADD CONSTRAINT "message_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_feedback" ADD CONSTRAINT "conversation_feedback_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_consents" ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_export_requests" ADD CONSTRAINT "data_export_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
