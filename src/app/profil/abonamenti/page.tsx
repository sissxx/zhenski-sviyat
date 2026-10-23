import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { CardSubscriptionToggle, SubscribeButtons } from "@/components/account/SubscriptionButtons";
import { ViberGroupCard } from "@/components/account/ViberGroups";
import { BankTransferDetails } from "@/components/events/BankTransferDetails";
import { FormAlert } from "@/components/forms/FormAlert";
import { Panel } from "@/components/ui/Panel";
import { requireUser } from "@/lib/auth/session";
import { getBankDetails } from "@/lib/events/queries";
import { formatDate, formatPrice } from "@/lib/locale";
import { routes } from "@/lib/routes";
import { syncReturnedCheckout } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe/server";
import {
  bankRenewalOpen,
  getSubscriptionSettings,
  listActivePlans,
  listMySubscriptions,
  listMyViberGroups,
  liveStatuses,
  type ActivePlan,
  type MySubscription,
  type SubscriptionStatus,
} from "@/lib/subscriptions/queries";
import { perInterval, planFeatures } from "@/lib/subscriptions/plans";
import { TextLink } from "@/components/ui/AppLink";

export const metadata: Metadata = { title: "Моите абонаменти" };

type Props = {
  searchParams: Promise<{ session_id?: string | string[]; plashtane?: string | string[]; plan?: string | string[] }>;
};

const statusLabels: Record<SubscriptionStatus, { label: string; color: "success" | "warning" | "default" | "error" | "info" }> = {
  pending_bank_transfer: { label: "Чака превод", color: "warning" },
  incomplete: { label: "Чака плащане", color: "warning" },
  trialing: { label: "Пробен период", color: "info" },
  active: { label: "Активен", color: "success" },
  past_due: { label: "Неуспешно плащане", color: "warning" },
  canceled: { label: "Прекратен", color: "default" },
  unpaid: { label: "Спрян", color: "error" },
  expired: { label: "Изтекъл", color: "default" },
};

const isLive = (s: MySubscription) => liveStatuses.includes(s.status);

export default async function AccountSubscriptionsPage({ searchParams }: Props) {
  const { user, profile } = await requireUser();
  const { session_id: sessionId, plashtane, plan: chosenSlug } = await searchParams;
  const cardAvailable = isStripeConfigured();
  // Back from Stripe Checkout: record the new subscription now instead of waiting for the webhook.
  if (typeof sessionId === "string" && cardAvailable) await syncReturnedCheckout(sessionId, user.id);

  const [plans, subscriptions, settings, viberGroups] = await Promise.all([
    listActivePlans(),
    listMySubscriptions(),
    getSubscriptionSettings(),
    listMyViberGroups(),
  ]);
  const live = subscriptions.filter(isLive);
  const past = subscriptions.filter((s) => !isLive(s)).slice(0, 10);
  const needsBank = live.some((s) => s.pendingPayment?.provider === "bank_transfer");
  const bank = needsBank ? await getBankDetails() : null;
  const justPaid = typeof sessionId === "string" && live.some((s) => s.provider === "stripe" && s.status === "active");

  return (
    <>
      {justPaid && <FormAlert severity="success">Благодарим! Абонаментът е активен.</FormAlert>}
      {typeof sessionId === "string" && !justPaid && (
        <FormAlert severity="info">Плащането се обработва. Обнови страницата след малко.</FormAlert>
      )}
      {plashtane === "prekasnato" && (
        <FormAlert severity="info">Плащането беше прекъснато и нищо не е таксувано. Можеш да опиташ отново.</FormAlert>
      )}

      <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
          Моите абонаменти
        </Typography>
        {live.length === 0 ? (
          <Typography sx={{ color: "text.secondary" }}>
            Все още нямаш активно членство. Когато се абонираш, тук ще виждаш до кога е платено.
          </Typography>
        ) : (
          live.map((s) => (
            <SubscriptionCard
              key={s.id}
              subscription={s}
              bank={bank}
              cardAvailable={cardAvailable}
              renewalWindowDays={settings.renewalWindowDays}
            />
          ))
        )}
      </Box>

      <Box component="section" aria-labelledby="viber-title" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography id="viber-title" variant="h5" component="h2" sx={{ color: "primary.main" }}>
          Моите Viber групи
        </Typography>
        {viberGroups.length === 0 ? (
          <Typography sx={{ color: "text.secondary" }}>
            {live.length > 0
              ? "Членството ти още не дава достъп до Viber група. Ще се появи тук, щом е активно."
              : "Линковете към Viber групите се появяват тук, когато имаш активно членство."}
          </Typography>
        ) : (
          <>
            {viberGroups.map((group) => (
              <ViberGroupCard key={group.viber_group_id} group={group} defaultPhone={profile?.phone ?? ""} />
            ))}
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Линковете са само за теб, не ги споделяй. Когато членството изтече, достъпът до групите спира и екипът те
              премахва от тях.
            </Typography>
          </>
        )}
      </Box>

      <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
          Членства
        </Typography>
        {plans.length === 0 ? (
          <Typography sx={{ color: "text.secondary" }}>
            Членствата скоро ще могат да се активират онлайн. Какво включват виж на страница{" "}
            <TextLink href={routes.membership}>Членство</TextLink>.
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                highlighted={plan.slug === chosenSlug}
                subscribed={live.some((s) => s.plan_id === plan.id)}
                card={cardAvailable}
                bank={settings.allowBankTransfer && plan.allow_bank_transfer}
              />
            ))}
          </Box>
        )}
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          С карта абонаментът се подновява автоматично всеки месец и можеш да го прекратиш по всяко време. По банков път
          превеждаш таксата всеки месец, а достъпът се активира, щом екипът потвърди плащането.
        </Typography>
      </Box>

      {past.length > 0 && (
        <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="h6" component="h2" sx={{ color: "primary.main" }}>
            Предишни
          </Typography>
          {past.map((s) => (
            <Typography key={s.id} variant="body2" sx={{ color: "text.secondary" }}>
              {s.plan?.name ?? "Членство"} · {statusLabels[s.status].label}
              {s.ended_at && ` · до ${formatDate(s.ended_at)}`}
            </Typography>
          ))}
        </Box>
      )}
    </>
  );
}

function SubscriptionCard({
  subscription: s,
  bank,
  cardAvailable,
  renewalWindowDays,
}: {
  subscription: MySubscription;
  bank: Awaited<ReturnType<typeof getBankDetails>>;
  cardAvailable: boolean;
  renewalWindowDays: number;
}) {
  const status = statusLabels[s.status];
  const card = s.provider === "stripe";
  const periodEnd = s.current_period_end;
  const renewalOpen = bankRenewalOpen(s, renewalWindowDays);

  return (
    <Panel tone="card" sx={{ gap: 1.25 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Typography variant="h6" component="h3" sx={{ color: "primary.main" }}>
          {s.plan?.name ?? "Членство"}
        </Typography>
        <Chip size="small" label={status.label} color={status.color} />
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {s.plan && `${formatPrice(s.plan.price_cents)} / ${perInterval(s.plan.billing_interval)} · `}
        {card ? "с карта" : "банков превод"}
        {periodEnd &&
          (card && !s.cancel_at_period_end
            ? ` · следващо плащане ${formatDate(periodEnd)}`
            : ` · платено до ${formatDate(periodEnd)}`)}
      </Typography>
      {card && s.cancel_at_period_end && periodEnd && (
        <Typography variant="body2">Абонаментът няма да се поднови. Достъпът остава до {formatDate(periodEnd)}.</Typography>
      )}
      {s.status === "past_due" && (
        <Typography variant="body2">
          Последното плащане с карта не мина. Stripe ще опита отново; провери картата си или се свържи с нас.
        </Typography>
      )}
      {s.pendingPayment?.provider === "bank_transfer" && (
        <BankTransferDetails
          amountCents={s.pendingPayment.amount_cents}
          reference={s.pendingPayment.bank_reference}
          deadline={s.pendingPayment.expires_at}
          bank={bank}
          subject="заявката"
        />
      )}
      {card && cardAvailable && ["active", "trialing", "past_due"].includes(s.status) && (
        <CardSubscriptionToggle subscriptionId={s.id} cancelling={s.cancel_at_period_end} />
      )}
      {renewalOpen && <SubscribeButtons planId={s.plan_id} card={false} bank bankLabel="Поднови с превод" />}
    </Panel>
  );
}

function PlanCard({
  plan,
  highlighted,
  subscribed,
  card,
  bank,
}: {
  plan: ActivePlan;
  highlighted: boolean;
  subscribed: boolean;
  card: boolean;
  bank: boolean;
}) {
  const features = planFeatures(plan.features);
  return (
    <Panel tone={highlighted ? "mint" : "card"} sx={{ gap: 1.25 }}>
      <Typography variant="h6" component="h3" sx={{ color: "primary.main" }}>
        {plan.name}
      </Typography>
      <Typography sx={{ fontWeight: 600 }}>
        {formatPrice(plan.price_cents)} / {perInterval(plan.billing_interval)}
      </Typography>
      {plan.description && (
        <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "pre-line" }}>
          {plan.description}
        </Typography>
      )}
      {features.length > 0 && (
        <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: 14 }}>
          {features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </Box>
      )}
      {subscribed ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Вече имаш това членство.
        </Typography>
      ) : card || bank ? (
        <SubscribeButtons planId={plan.id} card={card} bank={bank} />
      ) : (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Онлайн плащането с карта ще бъде достъпно съвсем скоро.
        </Typography>
      )}
    </Panel>
  );
}
