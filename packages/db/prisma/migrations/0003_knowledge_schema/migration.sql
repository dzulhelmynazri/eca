-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('FILE', 'WEBSITE');

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "KnowledgeSourceStatus" AS ENUM ('READY', 'SYNCING', 'FAILED');

-- CreateEnum
CREATE TYPE "KnowledgeJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "knowledge_source" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "KnowledgeSourceType" NOT NULL,
    "status" "KnowledgeSourceStatus" NOT NULL DEFAULT 'SYNCING',
    "sourceUrl" TEXT,
    "fileKey" TEXT,
    "fileName" TEXT,
    "sizeBytes" INTEGER,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "externalId" TEXT,
    "contentMarkdown" TEXT NOT NULL,
    "contentText" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "contentLength" INTEGER NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunk" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "contentLength" INTEGER NOT NULL,
    "embeddingModel" TEXT NOT NULL,
    "embeddingDimension" INTEGER NOT NULL,
    "embedding" vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_ingestion_job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "KnowledgeJobStatus" NOT NULL DEFAULT 'QUEUED',
    "trigger" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_ingestion_job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_source_userId_createdAt_idx" ON "knowledge_source"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "knowledge_source_userId_status_updatedAt_idx" ON "knowledge_source"("userId", "status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "knowledge_document_userId_sourceId_createdAt_idx" ON "knowledge_document"("userId", "sourceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "knowledge_document_sourceId_contentHash_idx" ON "knowledge_document"("sourceId", "contentHash");

-- CreateIndex
CREATE INDEX "knowledge_chunk_userId_sourceId_documentId_chunkIndex_idx" ON "knowledge_chunk"("userId", "sourceId", "documentId", "chunkIndex");

-- CreateIndex
CREATE INDEX "knowledge_chunk_documentId_chunkIndex_idx" ON "knowledge_chunk"("documentId", "chunkIndex");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_chunk_documentId_chunkIndex_key" ON "knowledge_chunk"("documentId", "chunkIndex");

-- CreateIndex
CREATE INDEX "knowledge_ingestion_job_userId_sourceId_createdAt_idx" ON "knowledge_ingestion_job"("userId", "sourceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "knowledge_ingestion_job_status_createdAt_idx" ON "knowledge_ingestion_job"("status", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "knowledge_source" ADD CONSTRAINT "knowledge_source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_document" ADD CONSTRAINT "knowledge_document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_document" ADD CONSTRAINT "knowledge_document_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "knowledge_source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunk" ADD CONSTRAINT "knowledge_chunk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunk" ADD CONSTRAINT "knowledge_chunk_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "knowledge_source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunk" ADD CONSTRAINT "knowledge_chunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "knowledge_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_ingestion_job" ADD CONSTRAINT "knowledge_ingestion_job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_ingestion_job" ADD CONSTRAINT "knowledge_ingestion_job_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "knowledge_source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
