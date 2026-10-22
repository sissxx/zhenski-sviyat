import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormAlert } from "@/components/forms/FormAlert";
import { Panel } from "@/components/ui/Panel";
import { getMySpecialist } from "@/lib/specialist/session";
import { accountNav, routes, specialistNavItem } from "@/lib/routes";

export const metadata: Metadata = { title: "Начало" };

const sectionText: Record<string, string> = {
  [routes.accountDetails]: "Име, телефон и настройки за имейли. Оттук сменяш и паролата си.",
  [routes.accountEvents]: "Събитията, за които си записана, и плащанията за тях.",
  [routes.accountConsultations]: "Запазените ти консултации: дата, час и специалист.",
  [routes.accountSubscriptions]: "Членството в клуба и Viber общността и линковете за достъп.",
  [routes.accountSpecialist]: "Като специалист: запазените при теб часове, работното ти време и отсъствията.",
};

type AccountHomeProps = { searchParams: Promise<{ potvarden?: string; parola?: string }> };

export default async function AccountHome({ searchParams }: AccountHomeProps) {
  const [{ potvarden, parola }, specialist] = await Promise.all([searchParams, getMySpecialist()]);

  return (
    <>
      {potvarden && <FormAlert severity="success">Имейлът ти е потвърден. Добре дошла в общността!</FormAlert>}
      {parola === "promenena" && <FormAlert severity="success">Паролата ти е сменена.</FormAlert>}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        {[...accountNav, ...(specialist ? [specialistNavItem] : [])]
          .filter((item) => item.href !== routes.account)
          .map((item) => (
            <Panel key={item.href} sx={{ gap: 1 }}>
              <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
                {item.label}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", flexGrow: 1 }}>
                {sectionText[item.href]}
              </Typography>
              <Button variant="outlined" size="small" href={item.href}>
                Отвори
              </Button>
            </Panel>
          ))}
      </Box>
    </>
  );
}
