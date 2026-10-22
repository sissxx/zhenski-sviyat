import { NextResponse } from "next/server";
import { personName, providerLabel, registrationStatus, paymentStatus } from "@/lib/admin/labels";
import { eventParticipants } from "@/lib/admin/queries";
import { AdminAccessError, requireAdminAction } from "@/lib/admin/session";
import { formatDateTime } from "@/lib/locale";

const cell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  // Quote every cell, and stop spreadsheet formulas in names someone typed.
  return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
};

/** Participant list of one event as a CSV file (Excel opens it thanks to the BOM and the semicolons). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let supabase;
  try {
    ({ supabase } = await requireAdminAction());
  } catch (error) {
    if (error instanceof AdminAccessError) return new NextResponse("Forbidden", { status: 403 });
    throw error;
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const { data: event } = await supabase.from("events").select("slug").eq("id", id).maybeSingle();
  if (!event) return new NextResponse("Not found", { status: 404 });

  const rows = await eventParticipants(supabase, id);
  const header = ["Име", "Имейл", "Телефон", "Статус", "Цена (€)", "Начин на плащане", "Плащане", "Основание за превод", "Записана", "Дошла"];
  const lines = rows.map((r) => {
    const payment = r.payments?.[0];
    return [
      personName(r.profiles),
      r.profiles?.email,
      r.profiles?.phone,
      registrationStatus[r.status].label,
      (r.price_cents / 100).toFixed(2).replace(".", ","),
      r.payment_method ? providerLabel[r.payment_method] : "",
      payment ? paymentStatus[payment.status].label : "",
      r.payment_method === "bank_transfer" ? payment?.bank_reference : "",
      formatDateTime(r.created_at),
      r.checked_in_at ? "да" : "",
    ]
      .map(cell)
      .join(";");
  });
  const body = "﻿" + [header.map(cell).join(";"), ...lines].join("\r\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="uchastnichki-${event.slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
