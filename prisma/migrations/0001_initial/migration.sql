-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BookOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED_READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'BANK_TRANSFER', 'MOBILE_PAYMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'VERIFICATION', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PrintStatus" AS ENUM ('RECEIVED', 'QUOTE_REQUIRED', 'QUOTED', 'AWAITING_PAYMENT', 'APPROVED', 'PRINTING', 'READY', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "author" TEXT,
    "isbn" TEXT,
    "description" TEXT NOT NULL,
    "priceMmk" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "imageUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "newArrival" BOOLEAN NOT NULL DEFAULT false,
    "bestseller" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "sampleData" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "township" TEXT NOT NULL,
    "deliveryInstructions" TEXT,
    "subtotalMmk" INTEGER NOT NULL,
    "deliveryMmk" INTEGER NOT NULL,
    "totalMmk" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "status" "BookOrderStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "statusHistory" JSONB NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "titleSnapshot" TEXT NOT NULL,
    "priceMmk" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotalMmk" INTEGER NOT NULL,

    CONSTRAINT "BookOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "storageKey" TEXT,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "pageCount" INTEGER,
    "printMode" TEXT NOT NULL,
    "paperSize" TEXT NOT NULL,
    "duplex" BOOLEAN NOT NULL,
    "pageRange" TEXT NOT NULL,
    "copies" INTEGER NOT NULL,
    "finishing" TEXT NOT NULL,
    "fulfillment" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "township" TEXT,
    "notes" TEXT,
    "customerConfirmedRights" BOOLEAN NOT NULL,
    "status" "PrintStatus" NOT NULL DEFAULT 'RECEIVED',
    "estimatedTotalMmk" INTEGER,
    "confirmedQuoteMmk" INTEGER,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "customerFacingNotes" TEXT,
    "adminNotes" TEXT,
    "statusHistory" JSONB NOT NULL,
    "fileDeletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintPricingRule" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "rateBwA4Mmk" INTEGER,
    "rateColorA4Mmk" INTEGER,
    "a3MultiplierBps" INTEGER NOT NULL DEFAULT 20000,
    "duplexDiscountBps" INTEGER NOT NULL DEFAULT 0,
    "stapleMmk" INTEGER NOT NULL DEFAULT 0,
    "spiralMmk" INTEGER NOT NULL DEFAULT 0,
    "minimumChargeMmk" INTEGER NOT NULL DEFAULT 0,
    "allowedPaperSizes" TEXT[] DEFAULT ARRAY['A4', 'A3']::TEXT[],
    "allowedFinishing" TEXT[] DEFAULT ARRAY['None', 'Staple', 'Spiral binding']::TEXT[],
    "allowedMimeTypes" TEXT[] DEFAULT ARRAY['application/pdf']::TEXT[],
    "maxFileSizeBytes" INTEGER NOT NULL DEFAULT 10485760,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_userId_expiresAt_idx" ON "AdminSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_status_categoryId_idx" ON "Product"("status", "categoryId");

-- CreateIndex
CREATE INDEX "Product_status_featured_idx" ON "Product"("status", "featured");

-- CreateIndex
CREATE INDEX "Product_status_newArrival_idx" ON "Product"("status", "newArrival");

-- CreateIndex
CREATE INDEX "Product_status_bestseller_idx" ON "Product"("status", "bestseller");

-- CreateIndex
CREATE INDEX "Product_isbn_idx" ON "Product"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "BookOrder_orderNumber_key" ON "BookOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BookOrder_idempotencyKey_key" ON "BookOrder"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BookOrder_phone_orderNumber_idx" ON "BookOrder"("phone", "orderNumber");

-- CreateIndex
CREATE INDEX "BookOrder_status_createdAt_idx" ON "BookOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BookOrderItem_orderId_idx" ON "BookOrderItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PrintOrder_orderNumber_key" ON "PrintOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PrintOrder_idempotencyKey_key" ON "PrintOrder"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PrintOrder_phone_orderNumber_idx" ON "PrintOrder"("phone", "orderNumber");

-- CreateIndex
CREATE INDEX "PrintOrder_status_createdAt_idx" ON "PrintOrder"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StoreSetting_key_key" ON "StoreSetting"("key");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_adminUserId_createdAt_idx" ON "AuditLog"("adminUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookOrderItem" ADD CONSTRAINT "BookOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BookOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookOrderItem" ADD CONSTRAINT "BookOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

