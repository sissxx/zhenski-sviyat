import Box from "@mui/material/Box";
import { AppLink } from "@/components/ui/AppLink";
import Typography from "@mui/material/Typography";
import { Section } from "@/components/ui/Section";
import { TeamAvatar } from "@/components/team/TeamAvatar";
import { routes } from "@/lib/routes";
import { listTeamMembers } from "@/lib/team/queries";

/** Founders strip on the homepage, from „Учредители и екип“ in the admin panel. */
export async function Founders() {
  const founders = (await listTeamMembers()).filter((m) => m.group === "founder");
  if (founders.length === 0) return null;
  return (
    <Section bg="background.paper" aria-labelledby="founders-title">
      <Typography id="founders-title" variant="h3" component="h2" sx={{ mb: 1 }}>
        Хората зад общността
      </Typography>
      <Typography sx={{ mb: 2.5, color: "text.secondary" }}>
        Юристи, психолози и специалисти в здравните грижи и естетиката.
      </Typography>
      <Box
        component="ul"
        sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1.75, gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", lg: "repeat(7, 1fr)" } }}
      >
        {founders.map((member) => (
          <li key={member.id}>
            <AppLink
              href={routes.founders}
              underline="none"
              sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, p: 1, borderRadius: "12px", "&:hover": { bgcolor: "brand.mint" } }}
            >
              <TeamAvatar member={member} size={54} />
              <Typography sx={{ fontWeight: 600, fontSize: 14, color: "brand.dark", textAlign: "center" }}>{member.shortName}</Typography>
              {member.shortRole && (
                <Typography sx={{ fontSize: 14, color: "text.secondary", textAlign: "center", mt: -0.5 }}>{member.shortRole}</Typography>
              )}
            </AppLink>
          </li>
        ))}
      </Box>
    </Section>
  );
}
