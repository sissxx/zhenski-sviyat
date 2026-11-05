import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { TeamAvatar } from "@/components/team/TeamAvatar";
import { NextSteps } from "@/components/ui/NextSteps";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { pageMetadata } from "@/lib/seo/metadata";
import { listTeamMembers } from "@/lib/team/queries";
import { teamGroups, teamGroupTitles } from "@/lib/team/types";

export const metadata: Metadata = pageMetadata("founders");

export default async function FoundersPage() {
  const members = await listTeamMembers();
  const groups = teamGroups
    .map((group) => ({ group, members: members.filter((m) => m.group === group) }))
    .filter((g) => g.members.length > 0);
  // Section headings only when there is more than one group to tell apart.
  const showHeadings = groups.length > 1;

  return (
    <>
      <PageIntro
        eyebrow="Учредители и екип"
        title="Запознай се с хората зад сдружението."
        lead="Учредители и специалисти с опит в подкрепата, правото, психологията и здравните грижи."
      />

      {groups.map(({ group, members: people }, index) => (
        <Section
          key={group}
          bg={index % 2 === 0 ? "background.paper" : "brand.mintLight"}
          aria-labelledby={showHeadings ? `team-${group}` : undefined}
          aria-label={showHeadings ? undefined : teamGroupTitles[group]}
        >
          {showHeadings && (
            <Typography id={`team-${group}`} variant="h3" component="h2" sx={{ mb: 2.5 }}>
              {teamGroupTitles[group]}
            </Typography>
          )}
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            {people.map((member) => (
              <Panel key={member.id} component="li" tone="card" sx={{ flexDirection: "row", alignItems: "flex-start", gap: 2.25 }}>
                <TeamAvatar member={member} size={member.photoUrl ? 96 : 64} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" component={showHeadings ? "h3" : "h2"} sx={{ fontSize: { xs: 19, md: 22 } }}>
                    {member.name}
                  </Typography>
                  {member.role && <Typography sx={{ fontSize: 14, mt: 0.75, color: "secondary.main", fontWeight: 600 }}>{member.role}</Typography>}
                  {member.bio && <Typography sx={{ fontSize: 15, mt: 1, whiteSpace: "pre-line" }}>{member.bio}</Typography>}
                </Box>
              </Panel>
            ))}
          </Box>
        </Section>
      ))}

      <NextSteps />
    </>
  );
}
