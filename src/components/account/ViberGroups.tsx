"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { FormAlert } from "@/components/forms/FormAlert";
import { FormTextField } from "@/components/forms/FormTextField";
import { Panel } from "@/components/ui/Panel";
import { requestViberAccess } from "@/lib/subscriptions/actions";
import { viberRequestSchema, type ViberRequestValues } from "@/lib/subscriptions/schemas";
import type { MyViberGroup } from "@/lib/subscriptions/queries";
import type { Database } from "@/lib/supabase/database.types";

type AccessStatus = Database["public"]["Enums"]["viber_access_status"];

const statusLabels: Record<AccessStatus, string> = {
  pending_invite: "Чака покана",
  invited: "Поканена",
  joined: "В групата",
  removal_pending: "Чака покана",
  removed: "Чака покана",
};

/** One Viber group the member's active membership opens: the invite link and "add my number". */
export function ViberGroupCard({ group, defaultPhone }: { group: MyViberGroup; defaultPhone: string }) {
  // The rpc returns a null status before the member has asked; the generated type doesn't say so.
  const status = group.access_status as AccessStatus | null;
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ViberRequestValues>({ resolver: zodResolver(viberRequestSchema), defaultValues: { phone: defaultPhone, displayName: "" } });
  const fieldId = (name: string) => `viber-${group.viber_group_id}-${name}`;

  const onSubmit = async (values: ViberRequestValues) => {
    setError(null);
    const result = await requestViberAccess(group.viber_group_id, values);
    if (result.ok) setSent(true);
    else setError(result.error);
  };

  const asked = sent || status !== null;

  return (
    <Panel tone="card" sx={{ gap: 1.25 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 1, width: "100%" }}>
        <Typography variant="h6" component="h3" sx={{ color: "primary.main" }}>
          {group.name}
        </Typography>
        {status && <Chip size="small" label={statusLabels[status]} color={status === "joined" ? "success" : "default"} />}
      </Box>
      {group.description && (
        <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "pre-line" }}>
          {group.description}
        </Typography>
      )}
      {group.invite_link ? (
        <Button variant="contained" href={group.invite_link} target="_blank" rel="noopener noreferrer">
          Влез в групата във Viber
        </Button>
      ) : (
        <Typography variant="body2">Линкът за тази група още не е готов. Остави номера си и екипът ще те добави.</Typography>
      )}
      {group.join_instructions && (
        <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
          {group.join_instructions}
        </Typography>
      )}

      {status !== "joined" &&
        (sent ? (
          <FormAlert severity="success">Благодарим! Екипът ще те добави в групата.</FormAlert>
        ) : (
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%", maxWidth: 520 }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {asked
                ? "Номерът ти е при екипа. Ако си го сменила, изпрати новия."
                : "Кажи ни с кой номер си във Viber, за да те разпознаем в групата."}
            </Typography>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <FormTextField
                id={fieldId("phone")}
                label="Номер във Viber"
                type="tel"
                autoComplete="tel"
                placeholder="+359 …"
                registration={register("phone")}
                error={errors.phone}
              />
              <FormTextField
                id={fieldId("name")}
                label="Име във Viber (по желание)"
                registration={register("displayName")}
                error={errors.displayName}
              />
            </Box>
            {error && <FormAlert severity="error">{error}</FormAlert>}
            <Button type="submit" variant="outlined" disabled={isSubmitting} sx={{ alignSelf: "flex-start" }}>
              {isSubmitting ? "Изпращане…" : "Изпрати номера"}
            </Button>
          </Box>
        ))}
    </Panel>
  );
}
