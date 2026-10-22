import type { Metadata } from "next";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { AdminNav } from "@/components/admin/AdminNav";
import { Section } from "@/components/ui/Section";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: { default: "Администрация", template: "%s · Администрация" },
  robots: { index: false, follow: false },
};

/** Admin area. Only active admins get past requireAdminPage; every query is checked again by RLS. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return (
    <Section bg="brand.mintLight" sx={{ py: { xs: 3, md: 5 } }}>
      <Box
        sx={{
          display: "grid",
          gap: { xs: 2.5, md: 4 },
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "220px minmax(0, 1fr)" },
          alignItems: "start",
        }}
      >
        <AdminNav />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>{children}</Box>
      </Box>
    </Section>
  );
}
