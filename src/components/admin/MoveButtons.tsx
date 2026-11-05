"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import type { AdminResult } from "@/lib/admin/actions";

type MoveButtonsProps = {
  /** Item name, for the buttons' screen-reader labels. */
  name: string;
  /** A server action bound to the item's id. */
  move: (direction: "up" | "down") => Promise<AdminResult>;
  isFirst: boolean;
  isLast: boolean;
};

/** Up/down arrows that move an item one place in its list, so nobody has to type order numbers. */
export function MoveButtons({ name, move, isFirst, isLast }: MoveButtonsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (direction: "up" | "down") =>
    startTransition(async () => {
      const result = await move(direction);
      if (result.ok) router.refresh();
      else setError(result.error);
    });

  return (
    <Box sx={{ display: "inline-flex", gap: 0.5 }}>
      <IconButton size="small" aria-label={`Премести ${name} нагоре`} disabled={pending || isFirst} onClick={() => run("up")}>
        <span aria-hidden>↑</span>
      </IconButton>
      <IconButton size="small" aria-label={`Премести ${name} надолу`} disabled={pending || isLast} onClick={() => run("down")}>
        <span aria-hidden>↓</span>
      </IconButton>
      <Snackbar open={error !== null} autoHideDuration={6000} onClose={() => setError(null)} message={error} />
    </Box>
  );
}
