import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { listPromotions, type PublicPromotion } from "@/lib/content/queries";
import { formatDate, formatPrice } from "@/lib/locale";
import { contactPath } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("packages");

export default async function PackagesPage() {
  const { items, fromContent } = await listPromotions();
  return (
    <>
      <PageIntro
        eyebrow="Пакети и промоции"
        title="Предложения за услуги и членство"
        lead={
          fromContent
            ? "Комбинирани предложения за услуги и членство. Конкретните пакети и цени предстои да бъдат потвърдени."
            : "Комбинирани предложения за услуги и членство и текущите ни промоции."
        }
      />

      <Section bg="background.paper" aria-label="Пакети и промоции">
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            m: 0,
            p: 0,
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          }}
        >
          {items.map((item) => (
            <PromotionCard key={item.id} item={item} draft={fromContent} />
          ))}
        </Box>
      </Section>
    </>
  );
}

/** "Валидна до 12 ноември 2026 г.", "Валидна от 6 до 12 ноември…", or nothing without dates. */
function validity({ validFrom, validUntil }: PublicPromotion): string | null {
  if (validFrom && validUntil) return `Валидна от ${formatDate(validFrom)} до ${formatDate(validUntil)}`;
  if (validUntil) return `Валидна до ${formatDate(validUntil)}`;
  if (validFrom && validFrom > new Date().toISOString()) return `Валидна от ${formatDate(validFrom)}`;
  return null;
}

function PromotionCard({ item, draft }: { item: PublicPromotion; draft: boolean }) {
  const period = validity(item);
  const external = item.ctaUrl ? /^https?:\/\//.test(item.ctaUrl) : false;
  return (
    <Panel component="li" sx={{ p: 0, overflow: "hidden", gap: 0 }}>
      {item.imageUrl && (
        <Box
          component="img"
          src={item.imageUrl}
          alt=""
          loading="lazy"
          sx={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover", display: "block" }}
        />
      )}
      <Box
        sx={{
          p: { xs: 2.5, md: 3 },
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 1.5,
          flexGrow: 1,
          width: "100%",
        }}
      >
        <Typography variant="h6" component="h2" sx={{ color: "primary.main" }}>
          {item.title}
        </Typography>
        {item.description && <Typography sx={{ fontSize: 14, whiteSpace: "pre-line" }}>{item.description}</Typography>}
        <Box sx={{ flexGrow: 1 }} />
        {item.priceCents !== null && (
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25, flexWrap: "wrap" }}>
            <Typography sx={{ fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: 28, lineHeight: 1.2, color: "brand.terracotta" }}>
              {formatPrice(item.priceCents)}
            </Typography>
            {item.originalPriceCents !== null && item.originalPriceCents > item.priceCents && (
              <Typography component="s" sx={{ fontSize: 16, color: "text.secondary" }}>
                <Box component="span" sx={visuallyHidden}>
                  Стара цена:{" "}
                </Box>
                {formatPrice(item.originalPriceCents)}
              </Typography>
            )}
          </Box>
        )}
        {period && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {period}
          </Typography>
        )}
        {draft && <Placeholder>Цена и условия.</Placeholder>}
        {item.ctaUrl ? (
          <Button
            variant="contained"
            color="secondary"
            href={item.ctaUrl}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {item.ctaLabel || "Научи повече"}
          </Button>
        ) : (
          <Button variant="outlined" href={contactPath(item.title)} aria-label={`Запитване за ${item.title}`}>
            {item.ctaLabel || "Запитване"}
          </Button>
        )}
      </Box>
    </Panel>
  );
}

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;
