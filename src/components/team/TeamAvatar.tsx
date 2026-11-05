import Box from "@mui/material/Box";
import { initials, type PublicTeamMember } from "@/lib/team/types";

/** Round portrait: the uploaded photo, or the person's initials until one is added. */
export function TeamAvatar({ member, size }: { member: Pick<PublicTeamMember, "name" | "photoUrl">; size: number }) {
  const sx = { width: size, height: size, flexShrink: 0, borderRadius: "50%" } as const;
  if (member.photoUrl) {
    return <Box component="img" src={member.photoUrl} alt="" loading="lazy" sx={{ ...sx, objectFit: "cover", bgcolor: "brand.sage" }} />;
  }
  return (
    <Box
      aria-hidden
      sx={{ ...sx, bgcolor: "brand.sage", color: "brand.dark", display: "grid", placeItems: "center", fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: size * 0.34 }}
    >
      {initials(member.name)}
    </Box>
  );
}
