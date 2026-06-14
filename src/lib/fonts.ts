/**
 * fonts.ts — premium typography via next/font (spec §7).
 *  - Sora               → headings, page titles, financial totals
 *  - Plus Jakarta Sans  → body, forms, tables, buttons, navigation
 */
import { Sora, Plus_Jakarta_Sans } from "next/font/google";

export const fontHeading = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});
