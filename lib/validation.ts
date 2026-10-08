import { z } from "zod";

const text = (max = 200) => z.string().trim().min(1).max(max);
export const phoneSchema = z.string().trim().regex(/^[+\d][\d\s()+-]{6,19}$/, "Enter a valid phone number.");
const optionalEmail = z.union([z.string().trim().email().max(254), z.literal("")]).optional();

export const checkoutSchema = z.object({
  customerName: text(120), phone: phoneSchema, email: optionalEmail,
  address: text(1000), city: text(100), township: text(100),
  deliveryInstructions: z.string().trim().max(1000).optional(),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER", "MOBILE_PAYMENT"]),
  items: z.array(z.object({ productId: text(60), selectedLevel: z.string().trim().max(80).optional(), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
  idempotencyKey: text(100),
});

const pages = z.string().trim().max(60).transform(value => value.replace(/\s+/g, ""))
  .pipe(z.string().regex(/^(all|[1-9]\d*(?:-[1-9]\d*)?(?:,[1-9]\d*(?:-[1-9]\d*)?)*)$/i));
export const printOrderSchema = z.object({
  customerName: text(120), phone: phoneSchema, email: optionalEmail,
  uploadToken: z.string().min(20).max(200),
  storageKey: z.string().regex(/^print-orders\/[a-f0-9]{16}\/[a-f0-9-]+\.pdf$/),
  originalFileName: text(180), mimeType: z.literal("application/pdf"), fileSizeBytes: z.number().int().positive(),
  printMode: z.enum(["BW", "COLOR"]), paperSize: z.enum(["A4", "A3"]), duplex: z.boolean(), pageRange: pages,
  copies: z.number().int().min(1).max(1000), finishing: z.enum(["None", "Staple", "Spiral binding"]),
  fulfillment: z.enum(["PICKUP", "DELIVERY"]), address: z.string().trim().max(1000).optional(),
  city: z.string().trim().max(100).optional(), township: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1500).optional(), customerConfirmedRights: z.literal(true),
}).superRefine((value, ctx) => {
  if (value.fulfillment === "DELIVERY" && (!value.address || !value.city || !value.township))
    ctx.addIssue({ code: "custom", message: "Please provide a delivery address, city, and township." });
});

const httpsImage = z.union([z.string().url().max(2000).refine(value => new URL(value).protocol === "https:"), z.literal("")]).optional();
export const productSchema = z.object({
  title: text(200), slug: text(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug."),
  author: z.string().trim().max(160).optional(), isbn: z.string().trim().max(40).optional(), level: z.string().trim().max(80).optional(), levels: z.array(z.string().trim().min(1).max(80)).max(40).default([]), description: text(5000),
  priceMmk: z.number().int().min(0).max(2_000_000_000), stock: z.number().int().min(0).max(10_000_000),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).default(5), imageUrl: httpsImage,
  categoryId: text(60), tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  featured: z.boolean().default(false), newArrival: z.boolean().default(false), bestseller: z.boolean().default(false),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
});

export const printPricingSchema = z.object({
  active: z.boolean(), rateBwA4Mmk: z.number().int().positive().nullable(), rateColorA4Mmk: z.number().int().positive().nullable(),
  a3MultiplierBps: z.number().int().min(1).max(1_000_000), duplexDiscountBps: z.number().int().min(0).max(10000),
  stapleMmk: z.number().int().min(0), spiralMmk: z.number().int().min(0), minimumChargeMmk: z.number().int().min(0),
  allowedPaperSizes: z.array(z.enum(["A4", "A3"])).min(1), allowedFinishing: z.array(z.enum(["None", "Staple", "Spiral binding"])).min(1),
  allowedMimeTypes: z.array(z.literal("application/pdf")).min(1), maxFileSizeBytes: z.number().int().min(1048576).max(104857600),
  retentionDays: z.number().int().min(1).max(365),
}).superRefine((value, ctx) => {
  if (value.active && (value.rateBwA4Mmk === null || value.rateColorA4Mmk === null))
    ctx.addIssue({ code: "custom", message: "Set the real rates for both print modes before enabling pricing." });
});
