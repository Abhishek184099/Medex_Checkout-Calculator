-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "price_satang" INTEGER NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orders_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "max_discount_satang" INTEGER,
    "scope_kind" TEXT NOT NULL,
    "scope_value" TEXT,
    "min_spend_satang" INTEGER NOT NULL DEFAULT 0,
    "starts_on" TEXT,
    "ends_on" TEXT,
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "per_customer_limit" INTEGER,
    "first_order_only" BOOLEAN NOT NULL DEFAULT false,
    "stackable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "user_id" TEXT NOT NULL,
    "coupon_code" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("user_id","coupon_code")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "subtotal_satang" INTEGER NOT NULL,
    "discount_satang" INTEGER NOT NULL,
    "net_satang" INTEGER NOT NULL,
    "vat_satang" INTEGER NOT NULL,
    "total_satang" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_lines" (
    "id" SERIAL NOT NULL,
    "order_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount_satang" INTEGER NOT NULL,
    "after_discounts_satang" INTEGER NOT NULL,
    "discounts" JSONB NOT NULL,

    CONSTRAINT "order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_coupons" (
    "order_id" TEXT NOT NULL,
    "coupon_code" TEXT NOT NULL,
    "discount_satang" INTEGER NOT NULL,

    CONSTRAINT "order_coupons_pkey" PRIMARY KEY ("order_id","coupon_code")
);

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_code_fkey" FOREIGN KEY ("coupon_code") REFERENCES "coupons"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_coupons" ADD CONSTRAINT "order_coupons_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_coupons" ADD CONSTRAINT "order_coupons_coupon_code_fkey" FOREIGN KEY ("coupon_code") REFERENCES "coupons"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
