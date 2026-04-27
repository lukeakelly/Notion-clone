-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "industry" TEXT,
    "projectType" TEXT NOT NULL,
    "estimateType" TEXT NOT NULL DEFAULT 'rom',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "targetDate" TIMESTAMP(3),
    "deliveryModel" TEXT,
    "methodology" TEXT,
    "requirementsClarity" TEXT NOT NULL DEFAULT 'clear',
    "designMaturity" TEXT NOT NULL DEFAULT 'existing',
    "integrationFamiliarity" TEXT NOT NULL DEFAULT 'known',
    "regulatoryComplexity" TEXT NOT NULL DEFAULT 'standard',
    "securityComplexity" TEXT NOT NULL DEFAULT 'standard',
    "performanceNeeds" TEXT NOT NULL DEFAULT 'standard',
    "techStackFamiliarity" TEXT NOT NULL DEFAULT 'known',
    "pmPercent" DOUBLE PRECISION NOT NULL DEFAULT 12.5,
    "baPercent" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "archPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "qaPercent" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "devopsPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "securityPercent" DOUBLE PRECISION NOT NULL DEFAULT 7.5,
    "docPercent" DOUBLE PRECISION NOT NULL DEFAULT 7.5,
    "contingencyPercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "includesFrontEnd" BOOLEAN NOT NULL DEFAULT false,
    "includesBackEnd" BOOLEAN NOT NULL DEFAULT false,
    "includesFullStack" BOOLEAN NOT NULL DEFAULT false,
    "includesApiIntegration" BOOLEAN NOT NULL DEFAULT false,
    "includesDataLayer" BOOLEAN NOT NULL DEFAULT false,
    "includesAuth" BOOLEAN NOT NULL DEFAULT false,
    "includesAdminConsole" BOOLEAN NOT NULL DEFAULT false,
    "includesReporting" BOOLEAN NOT NULL DEFAULT false,
    "includesWorkflowEngine" BOOLEAN NOT NULL DEFAULT false,
    "includesAiCapability" BOOLEAN NOT NULL DEFAULT false,
    "includesThirdParty" BOOLEAN NOT NULL DEFAULT false,
    "includesDevOps" BOOLEAN NOT NULL DEFAULT false,
    "includesMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "questionnaireData" JSONB,
    "totalLowDays" DOUBLE PRECISION,
    "totalLikelyDays" DOUBLE PRECISION,
    "totalHighDays" DOUBLE PRECISION,
    "totalLowCost" DOUBLE PRECISION,
    "totalLikelyCost" DOUBLE PRECISION,
    "totalHighCost" DOUBLE PRECISION,
    "confidenceLevel" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rateCardId" TEXT,

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScopeItem" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'must',
    "complexity" TEXT NOT NULL DEFAULT 'medium',
    "effortDriver" TEXT,
    "lowEffort" DOUBLE PRECISION,
    "likelyEffort" DOUBLE PRECISION,
    "highEffort" DOUBLE PRECISION,
    "assumptions" TEXT,
    "exclusions" TEXT,
    "risks" TEXT,
    "confidence" TEXT,
    "overridden" BOOLEAN NOT NULL DEFAULT false,
    "overrideNote" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScopeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleEstimate" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "phase" TEXT,
    "workstream" TEXT,

    CONSTRAINT "RoleEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT NOT NULL DEFAULT 'medium',
    "likelihood" TEXT NOT NULL DEFAULT 'medium',
    "mitigation" TEXT,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assumption" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "relatedScopeItem" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateVersion" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateCard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateCardRole" (
    "id" TEXT NOT NULL,
    "rateCardId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "standardRate" DOUBLE PRECISION NOT NULL,
    "costRate" DOUBLE PRECISION,
    "margin" DOUBLE PRECISION,
    "location" TEXT,
    "seniority" TEXT,

    CONSTRAINT "RateCardRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Estimate_status_idx" ON "Estimate"("status");

-- CreateIndex
CREATE INDEX "Estimate_createdById_idx" ON "Estimate"("createdById");

-- CreateIndex
CREATE INDEX "Estimate_createdAt_idx" ON "Estimate"("createdAt");

-- CreateIndex
CREATE INDEX "ScopeItem_estimateId_idx" ON "ScopeItem"("estimateId");

-- CreateIndex
CREATE INDEX "RoleEstimate_estimateId_idx" ON "RoleEstimate"("estimateId");

-- CreateIndex
CREATE INDEX "Risk_estimateId_idx" ON "Risk"("estimateId");

-- CreateIndex
CREATE INDEX "Assumption_estimateId_idx" ON "Assumption"("estimateId");

-- CreateIndex
CREATE INDEX "EstimateVersion_estimateId_idx" ON "EstimateVersion"("estimateId");

-- CreateIndex
CREATE INDEX "RateCardRole_rateCardId_idx" ON "RateCardRole"("rateCardId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_rateCardId_fkey" FOREIGN KEY ("rateCardId") REFERENCES "RateCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeItem" ADD CONSTRAINT "ScopeItem_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleEstimate" ADD CONSTRAINT "RoleEstimate_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assumption" ADD CONSTRAINT "Assumption_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateVersion" ADD CONSTRAINT "EstimateVersion_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCardRole" ADD CONSTRAINT "RateCardRole_rateCardId_fkey" FOREIGN KEY ("rateCardId") REFERENCES "RateCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
