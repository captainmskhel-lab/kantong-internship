/**
 * validation.ts — Zod schemas shared by API routes and React Hook Form.
 * All money fields are integer rupiah; all dates are ISO YYYY-MM-DD.
 */
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid");
const rupiahInt = z
  .number({ invalid_type_error: "Nominal harus berupa angka" })
  .int("Nominal harus bilangan bulat")
  .min(0, "Nominal tidak boleh negatif")
  .max(1_000_000_000_000, "Nominal terlalu besar");

export const loginSchema = z.object({
  username: z.string().min(1, "Username belum diisi").max(60),
  password: z.string().min(1, "Password belum diisi").max(200),
  remember: z.boolean().optional().default(false),
});

export const pinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, "PIN harus 6 digit angka"),
});

export const paymentSchema = z.object({
  memberId: z.string().uuid("Anggota belum dipilih"),
  months: z
    .array(z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }))
    .min(1, "Pilih minimal satu bulan iuran"),
  amount: rupiahInt.refine((v) => v > 0, "Nominal harus lebih dari nol"),
  paymentMethod: z.enum(["transfer", "cash"]),
  cashDeposited: z.boolean().default(false),
  transactionDate: isoDate,
  proofUrl: z.string().url("Link bukti tidak valid").max(1000).optional().or(z.literal("")),
  proofTitle: z.string().max(120).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
  visibleToViewers: z.boolean().default(true),
  proofVisibleToViewers: z.boolean().default(true),
});

export const incomeSchema = z.object({
  title: z.string().min(1, "Judul belum diisi").max(160),
  categoryId: z.string().uuid().nullable().optional(),
  amount: rupiahInt.refine((v) => v > 0, "Nominal harus lebih dari nol"),
  date: isoDate,
  paymentMethod: z.enum(["transfer", "cash"]),
  cashDeposited: z.boolean().default(false),
  source: z.string().max(160).optional().or(z.literal("")),
  proofUrl: z.string().url("Link bukti tidak valid").max(1000).optional().or(z.literal("")),
  proofTitle: z.string().max(120).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
  internalNote: z.string().max(500).optional().or(z.literal("")),
  visibleToViewers: z.boolean().default(true),
  proofVisibleToViewers: z.boolean().default(true),
});

export const expenseSchema = z.object({
  title: z.string().min(1, "Judul belum diisi").max(160),
  categoryId: z.string().uuid().nullable().optional(),
  amount: rupiahInt.refine((v) => v > 0, "Nominal harus lebih dari nol"),
  date: isoDate,
  paymentMethod: z.enum(["transfer", "cash"]),
  recipient: z.string().max(160).optional().or(z.literal("")),
  proofUrl: z.string().url("Link bukti tidak valid").max(1000).optional().or(z.literal("")),
  proofTitle: z.string().max(120).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  internalNote: z.string().max(500).optional().or(z.literal("")),
  visibleToViewers: z.boolean().default(true),
  proofVisibleToViewers: z.boolean().default(true),
  acknowledgeNegative: z.boolean().optional().default(false),
});

export const cancelSchema = z.object({
  reason: z.string().min(3, "Tulis alasan singkat").max(300),
});

export const editTransactionSchema = z.object({
  amount: rupiahInt.optional(),
  transaction_date: isoDate.optional(),
  payment_method: z.enum(["transfer", "cash"]).optional(),
  category_id: z.string().uuid().nullable().optional(),
  proof_url: z.string().url().max(1000).nullable().optional().or(z.literal("")),
  proof_title: z.string().max(120).nullable().optional().or(z.literal("")),
  description: z.string().max(500).nullable().optional().or(z.literal("")),
  internal_note: z.string().max(500).nullable().optional().or(z.literal("")),
  visible_to_viewers: z.boolean().optional(),
  proof_visible_to_viewers: z.boolean().optional(),
  reason: z.string().min(3, "Tulis alasan perubahan").max(300),
});

export const visibilitySchema = z.object({
  visible_to_viewers: z.boolean().optional(),
  proof_visible_to_viewers: z.boolean().optional(),
});

export const reconciliationSchema = z.object({
  date: isoDate,
  actualBankBalance: rupiahInt,
  note: z.string().max(300).optional().or(z.literal("")),
});

export const memberPatchSchema = z.object({
  full_name: z.string().min(1).max(120).optional(),
  active: z.boolean().optional(),
  internal_note: z.string().max(500).nullable().optional(),
});

export const settingsSchema = z.object({
  organization_name: z.string().min(1).max(120).optional(),
  monthly_dues_amount: rupiahInt.optional(),
  due_day: z.number().int().min(1).max(28).optional(),
  internship_start_date: isoDate.nullable().optional(),
  internship_end_date: isoDate.nullable().optional(),
  opening_balance: rupiahInt.optional(),
  opening_balance_date: isoDate.nullable().optional(),
});

export const setupSchema = z.object({
  organizationName: z.string().min(1).max(120),
  monthlyDuesAmount: rupiahInt.refine((v) => v > 0, "Iuran harus lebih dari nol"),
  dueDay: z.number().int().min(1).max(28),
  startMonth: z.object({ year: z.number().int().min(2000).max(2100), month: z.number().int().min(1).max(12) }),
  openingBalance: rupiahInt,
  openingBalanceDate: isoDate.nullable().optional(),
  internshipStartDate: isoDate.nullable().optional(),
  internshipEndDate: isoDate.nullable().optional(),
  username: z.string().min(3, "Username minimal 3 karakter").max(60),
  password: z.string().min(8, "Password minimal 8 karakter").max(200),
  pin: z.string().regex(/^\d{6}$/, "PIN harus 6 digit"),
});

export const changeUsernameSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini belum diisi"),
  newUsername: z.string().min(3, "Username minimal 3 karakter").max(60),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini belum diisi"),
    newPassword: z.string().min(8, "Password minimal 8 karakter").max(200),
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  });

export const changePinSchema = z
  .object({
    currentPassword: z.string().min(1, "Password bendahara belum diisi"),
    newPin: z.string().regex(/^\d{6}$/, "PIN harus 6 digit"),
    confirmPin: z.string().regex(/^\d{6}$/, "PIN harus 6 digit"),
  })
  .refine((v) => v.newPin === v.confirmPin, { message: "Konfirmasi PIN tidak sama", path: ["confirmPin"] });

export type PaymentInput = z.infer<typeof paymentSchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type SetupFormInput = z.infer<typeof setupSchema>;
