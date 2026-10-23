import { afterEach, describe, expect, it, vi } from "vitest";
import { consultationReminder, dayPhrase, eventReminder, subscriptionRenewalReminder } from "@/lib/email/templates";
import { plain } from "./helpers";

vi.mock("@/lib/email/reminders", () => ({ sendDueReminders: vi.fn(async () => ({ status: "done", due: 0, results: {} })) }));

// 12:00 Sofia time on 23 October 2026 (UTC+3).
const now = new Date("2026-10-23T09:00:00Z");

describe("reminder wording", () => {
  it("says today, tomorrow or the date, by the Sofia calendar", () => {
    expect(dayPhrase("2026-10-23T20:30:00Z", now)).toBe("днес"); // 23:30 in Sofia
    expect(dayPhrase("2026-10-23T21:30:00Z", now)).toBe("утре"); // 00:30 the next day
    expect(dayPhrase("2026-10-23T15:00:00Z", now)).toBe("днес");
    expect(dayPhrase("2026-10-24T20:59:00Z", now)).toBe("утре");
    expect(plain(dayPhrase("2026-10-24T21:00:00Z", now))).toBe("на 25 октомври 2026 г.");
  });

  it("reminds about a consultation with its details and the cancel deadline", () => {
    vi.useFakeTimers({ now });
    const email = consultationReminder({
      firstName: "Мария",
      serviceName: "Психологическа консултация",
      specialistName: "Силвия Петрова",
      startsAt: "2026-10-24T07:00:00Z",
      endsAt: "2026-10-24T08:00:00Z",
      locationInfo: "Онлайн, линк по имейл",
      priceCents: 4000,
      accountUrl: "https://example.org/profil/konsultatsii",
      cancelDeadlineHours: 24,
    });
    expect(email.subject).toBe("Напомняне: консултацията ти е утре в 10:00");
    expect(email.preheader).toBe("Психологическа консултация със Силвия Петрова, утре в 10:00.");
    expect(email.greeting).toBe("Здравей, Мария,");
    expect(JSON.stringify(email.blocks)).toContain("до 24 ч. преди началото");
  });

  it("puts the joining link in an online event reminder", () => {
    vi.useFakeTimers({ now });
    const email = eventReminder({
      firstName: null,
      eventTitle: "Есенна среща",
      startsAt: "2026-10-23T15:30:00Z",
      endsAt: "2026-10-23T17:30:00Z",
      place: "Онлайн",
      eventUrl: "https://example.org/sabitiya/esenna-sreshta",
      accountUrl: "https://example.org/profil/sabitiya",
      onlineUrl: "https://meet.example.org/abc",
    });
    expect(email.subject).toBe("Напомняне: „Есенна среща“ е днес от 18:30");
    expect(email.greeting).toBe("Здравей,");
    expect(email.blocks).toContainEqual({ kind: "button", label: "Връзка за включване", url: "https://meet.example.org/abc" });
  });

  it("asks to renew a membership, or for the transfer once the renewal is started", () => {
    const base = {
      firstName: "Ива",
      planName: "Клуб Красота",
      priceCents: 800,
      paidUntil: "2026-10-26T22:00:00Z", // midnight in Sofia, after the clocks go back,
      accountUrl: "https://example.org/profil/abonamenti",
    };
    const renew = subscriptionRenewalReminder({ ...base, bank: null });
    expect(plain(renew.subject)).toBe("Напомняне: членството „Клуб Красота“ изтича на 27 октомври 2026 г.");
    expect(renew.heading).toBe("Време е за подновяване");
    expect(renew.blocks).toContainEqual({ kind: "button", label: "Поднови членството", url: base.accountUrl });

    const transfer = subscriptionRenewalReminder({
      ...base,
      bank: { amountCents: 800, reference: "NSJS-ABC123", deadline: null, beneficiary: null, iban: "BG80BNBG96611020345678", bic: null, bankName: null },
    });
    expect(transfer.heading).toBe("Очакваме превода ти");
    expect(JSON.stringify(transfer.blocks)).toContain("NSJS-ABC123");
  });

  afterEach(() => vi.useRealTimers());
});

describe("reminder endpoint", () => {
  afterEach(() => vi.unstubAllEnvs());

  const call = async (authorization?: string) => {
    const { POST } = await import("@/app/api/cron/reminders/route");
    return POST(new Request("http://localhost/api/cron/reminders", { method: "POST", headers: authorization ? { authorization } : {} }));
  };

  it("is closed until the cron secret is set", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_abc");
    expect((await call("Bearer ")).status).toBe(503);
  });

  it("runs only with the right secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret-value");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_abc");
    expect((await call()).status).toBe(401);
    expect((await call("Bearer s3cret-valuX")).status).toBe(401);
    const ok = await call("Bearer s3cret-value");
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ status: "done", due: 0, results: {} });
  });
});
