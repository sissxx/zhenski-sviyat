import Box from "@mui/material/Box";
import { AppLink } from "@/components/ui/AppLink";
import Typography from "@mui/material/Typography";
import { NsjsWordmark } from "@/components/brand/Logo";
import { footerNav, routes } from "@/lib/routes";
import { NewsletterForm } from "./NewsletterForm";
import { site } from "@/lib/site";

const linkSx = { color: "brand.sage", fontSize: 13, "&:hover": { color: "brand.paper" } } as const;

export function SiteFooter() {
  return (
    <Box component="footer" sx={{ bgcolor: "brand.dark", color: "brand.paper", py: { xs: 5, md: 5.25 } }}>
      <Box sx={{ maxWidth: 1320, mx: "auto", px: { xs: 2, sm: 3, md: 4, xl: 0 } }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, md: 4.75 },
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "1.4fr repeat(3, 1fr) 1.4fr" },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <NsjsWordmark inverse />
            <Typography sx={{ fontSize: 13, color: "brand.sage", maxWidth: 240 }}>
              Обединяваме и подкрепяме жените за по-добър живот.
            </Typography>
          </Box>

          {footerNav.map((group) => (
            <Box key={group.title.label} component="nav" aria-label={group.title.label}>
              <AppLink
               
                href={group.title.href}
                sx={{ display: "block", fontWeight: 600, fontSize: 14, color: "brand.paper", mb: 1.25 }}
              >
                {group.title.label}
              </AppLink>
              <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.25 }}>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <AppLink href={link.href} sx={linkSx}>
                      {link.label}
                    </AppLink>
                  </li>
                ))}
              </Box>
            </Box>
          ))}

          <Box>
            <NewsletterForm />
            <Typography sx={{ fontSize: 12, color: "brand.sage" }}>
              <AppLink href={routes.privacy} sx={linkSx}>
                Поверителност
              </AppLink>
              {" · "}
              <AppLink href={routes.terms} sx={linkSx}>
                Общи условия
              </AppLink>
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ mt: 5, pt: 3, borderTop: "1px solid rgba(255,255,252,0.15)", fontSize: 12, color: "brand.sage" }}>
          © {new Date().getFullYear()} {site.orgFullName}
        </Typography>
      </Box>
    </Box>
  );
}
