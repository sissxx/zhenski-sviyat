import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { TeamAvatar } from "@/components/team/TeamAvatar";
import { AppLink } from "@/components/ui/AppLink";
import { NextSteps } from "@/components/ui/NextSteps";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { goals, supportAreas } from "@/content/about";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/metadata";
import { listTeamMembers } from "@/lib/team/queries";
import { teamGroups, teamGroupTitles } from "@/lib/team/types";

export const metadata: Metadata = pageMetadata("about");

/** Jump links to the sections that used to be separate pages (/tseli-i-sabitiya and /uchrediteli redirect here). */
const sections = [
  { id: "napravleniya", label: "Направления" },
  { id: "tseli", label: "Нашите цели" },
  { id: "ekip", label: "Учредители и екип" },
];

/** Room above a section when a jump link scrolls to it, so the sticky header doesn't cover its heading. */
const anchorOffset = { scrollMarginTop: { xs: 72, md: 96 } } as const;

export default async function AboutPage() {
  const members = await listTeamMembers();
  const groups = teamGroups
    .map((group) => ({ group, members: members.filter((m) => m.group === group) }))
    .filter((g) => g.members.length > 0);

  return (
    <>
      <PageIntro
        eyebrow="За сдружението"
        title="Подкрепа, развитие и взаимопомощ"
        lead="Обединяваме жени и специалисти, за да създаваме пространство за разбиране, знания, личностно израстване и професионално развитие."
      />

      <Box component="nav" aria-label="На тази страница" sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ maxWidth: 1320, mx: "auto", px: { xs: 2, sm: 3, md: 4, xl: 0 }, py: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {sections.map((section) => (
            <Button key={section.id} variant="outlined" size="small" href={`#${section.id}`} sx={{ minWidth: 0 }}>
              {section.label}
            </Button>
          ))}
        </Box>
      </Box>

      <Section id="napravleniya" bg="background.paper" aria-labelledby="areas-title" sx={anchorOffset}>
        <Typography id="areas-title" variant="h3" component="h2" sx={{ mb: 2.5 }}>
          Направления на подкрепа
        </Typography>
        <Box
          component="ul"
          sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}
        >
          {supportAreas.map((area, index) => (
            <Panel key={area.title} component="li" tone={index % 2 === 0 ? "card" : "paper"} sx={{ p: 2.5, gap: 1.25 }}>
              <Typography variant="h6" component="h3" sx={{ color: "primary.main" }}>
                {area.title}
              </Typography>
              <Typography sx={{ fontSize: 14, flexGrow: 1 }}>{area.text}</Typography>
              <AppLink href={routes.consultations} aria-label={`Запиши консултация: ${area.title}`} sx={{ fontSize: 14, fontWeight: 600 }}>
                Запиши консултация <span aria-hidden>→</span>
              </AppLink>
            </Panel>
          ))}
        </Box>
      </Section>

      <Section id="tseli" bg="brand.mintLight" aria-labelledby="goals-title" sx={anchorOffset}>
        <Typography id="goals-title" variant="h3" component="h2" sx={{ mb: 2.5 }}>
          Нашите цели
        </Typography>
        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.75 }}>
          {goals.map((goal, index) => (
            <Box
              component="li"
              key={goal}
              sx={{
                bgcolor: index % 2 === 0 ? "brand.mint" : "background.paper",
                borderRadius: "12px",
                p: { xs: 2, md: 2.25 },
                display: "grid",
                gap: { xs: 1, sm: 2.5 },
                gridTemplateColumns: { xs: "1fr", sm: "48px 1fr" },
              }}
            >
              <Typography aria-hidden sx={{ fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: 18, color: "primary.main" }}>
                {String(index + 1).padStart(2, "0")}
              </Typography>
              <Typography sx={{ fontSize: 14 }}>{goal}</Typography>
            </Box>
          ))}
        </Box>
      </Section>

      <Section id="ekip" bg="background.paper" aria-labelledby="team-title" sx={anchorOffset}>
        <Typography id="team-title" variant="h3" component="h2" sx={{ mb: 1 }}>
          Учредители и екип
        </Typography>
        <Typography sx={{ mb: 3, color: "text.secondary" }}>
          Учредители и специалисти с опит в подкрепата, правото, психологията и здравните грижи.
        </Typography>
        {groups.length === 0 && <Typography sx={{ color: "text.secondary" }}>Скоро ще представим екипа тук.</Typography>}
        {groups.map(({ group, members: people }) => (
          <Box key={group} sx={{ "& + &": { mt: 4 } }}>
            {groups.length > 1 && (
              <Typography variant="h5" component="h3" sx={{ mb: 2, color: "primary.main" }}>
                {teamGroupTitles[group]}
              </Typography>
            )}
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
              {people.map((member) => (
                <Panel key={member.id} component="li" tone="card" sx={{ flexDirection: "row", alignItems: "flex-start", gap: 2.25 }}>
                  <TeamAvatar member={member} size={member.photoUrl ? 96 : 64} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" component={groups.length > 1 ? "h4" : "h3"} sx={{ fontSize: { xs: 19, md: 22 } }}>
                      {member.name}
                    </Typography>
                    {member.role && <Typography sx={{ fontSize: 14, mt: 0.75, color: "secondary.main", fontWeight: 600 }}>{member.role}</Typography>}
                    {member.bio && <Typography sx={{ fontSize: 15, mt: 1, whiteSpace: "pre-line" }}>{member.bio}</Typography>}
                  </Box>
                </Panel>
              ))}
            </Box>
          </Box>
        ))}
      </Section>

      <NextSteps />
    </>
  );
}
