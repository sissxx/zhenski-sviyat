"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import { FormAlert } from "@/components/forms/FormAlert";
import { savePlanGroups } from "@/lib/admin/actions";

type Group = { id: string; name: string; active: boolean };

/** Which Viber groups a membership plan opens. */
export function PlanGroupsForm({ planId, groups, selected }: { planId: string; groups: Group[]; selected: string[] }) {
  const router = useRouter();
  const [ids, setIds] = useState(selected);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!groups.length) return <Typography sx={{ color: "text.secondary" }}>Още няма Viber групи.</Typography>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {groups.map((group) => (
          <FormControlLabel
            key={group.id}
            control={
              <Checkbox
                checked={ids.includes(group.id)}
                onChange={(e) => setIds((current) => (e.target.checked ? [...current, group.id] : current.filter((id) => id !== group.id)))}
              />
            }
            label={group.active ? group.name : `${group.name} (неактивна)`}
          />
        ))}
      </Box>
      {feedback && <FormAlert severity={feedback.ok ? "success" : "error"}>{feedback.message}</FormAlert>}
      <Button
        variant="contained"
        disabled={pending}
        sx={{ alignSelf: "flex-start" }}
        onClick={() =>
          startTransition(async () => {
            const result = await savePlanGroups(planId, ids);
            setFeedback(result.ok ? { ok: true, message: "Групите са запазени." } : { ok: false, message: result.error });
            if (result.ok) router.refresh();
          })
        }
      >
        {pending ? "Запазване…" : "Запази групите"}
      </Button>
    </Box>
  );
}
