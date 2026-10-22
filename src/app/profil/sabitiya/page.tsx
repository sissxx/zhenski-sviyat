import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { CancelRegistrationButton } from "@/components/account/CancelRegistrationButton";
import { EmptyState } from "@/components/account/EmptyState";
import { AppLink } from "@/components/ui/AppLink";
import { Panel } from "@/components/ui/Panel";
import { listMyRegistrations, type MyRegistration } from "@/lib/events/queries";
import { eventLocationLabel, registrationStatusLabels } from "@/lib/events/types";
import { formatDateTime, formatPrice } from "@/lib/locale";
import { eventConfirmationPath, eventPath, routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Моите събития" };

const statusColors = {
  confirmed: "success",
  pending_payment: "warning",
  cancelled: "default",
  expired: "default",
} as const;

const isActive = (r: MyRegistration) => r.status === "confirmed" || r.status === "pending_payment";
const isUpcoming = (r: MyRegistration) => !!r.event && new Date(r.event.starts_at).getTime() > Date.now();

export default async function AccountEventsPage() {
  const registrations = await listMyRegistrations();
  if (registrations.length === 0) {
    return (
      <EmptyState title="Моите събития" action={{ label: "Виж предстоящите събития", href: routes.events }}>
        Все още нямаш записвания. Когато се запишеш за събитие, тук ще виждаш датата, мястото и статуса на плащането.
      </EmptyState>
    );
  }

  const current = registrations
    .filter((r) => isActive(r) && isUpcoming(r))
    .sort((a, b) => a.event!.starts_at.localeCompare(b.event!.starts_at));
  const history = registrations.filter((r) => !current.includes(r));

  return (
    <>
      <RegistrationGroup title="Предстоящи" items={current} empty="Нямаш записвания за предстоящи събития." />
      {history.length > 0 && <RegistrationGroup title="История" items={history} />}
      <Button variant="outlined" href={routes.events} sx={{ alignSelf: "flex-start" }}>
        Виж всички събития
      </Button>
    </>
  );
}

function RegistrationGroup({ title, items, empty }: { title: string; items: MyRegistration[]; empty?: string }) {
  return (
    <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
        {title}
      </Typography>
      {items.length === 0 && empty && <Typography sx={{ color: "text.secondary" }}>{empty}</Typography>}
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {items.map((registration) => (
          <li key={registration.id}>
            <RegistrationCard registration={registration} />
          </li>
        ))}
      </Box>
    </Box>
  );
}

function RegistrationCard({ registration }: { registration: MyRegistration }) {
  const { event, payment } = registration;
  if (!event) return null;
  const pending = registration.status === "pending_payment";
  const canCancel = isActive(registration) && isUpcoming(registration);

  return (
    <Panel tone="card" sx={{ gap: 1.25 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Typography variant="h6" component="h3" sx={{ color: "primary.main" }}>
          <AppLink href={eventPath(event.slug)} sx={{ color: "inherit" }}>
            {event.title}
          </AppLink>
        </Typography>
        <Chip size="small" label={registrationStatusLabels[registration.status]} color={statusColors[registration.status]} />
      </Box>
      <Typography variant="body2">
        <time dateTime={event.starts_at}>{formatDateTime(event.starts_at)}</time> · {eventLocationLabel(event)}
        {event.status === "cancelled" && (
          <Box component="strong" sx={{ color: "error.main" }}>
            {" "}· събитието е отменено
          </Box>
        )}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {registration.price_cents === 0
          ? "Безплатно"
          : `${formatPrice(registration.price_cents)} · ${registration.payment_method === "bank_transfer" ? "банков превод" : "карта"}`}
        {pending && payment?.bank_reference && ` · основание ${payment.bank_reference}`}
        {pending && registration.hold_expires_at && ` · срок за плащане ${formatDateTime(registration.hold_expires_at)}`}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 1.5 }}>
        {isActive(registration) && (
          <Button size="small" variant={pending ? "contained" : "outlined"} href={`${eventConfirmationPath(event.slug)}?zapisvane=${registration.id}`}>
            {pending ? "Данни за превода" : "Подробности"}
          </Button>
        )}
        {canCancel && <CancelRegistrationButton registrationId={registration.id} paid={registration.status === "confirmed" && registration.price_cents > 0} />}
      </Box>
    </Panel>
  );
}
