"use client";

import { useCallback, useEffect, useState } from "react";
import { loadSlots } from "@/lib/consultations/actions";
import type { ConsultationSlot } from "@/lib/consultations/types";

/**
 * Free slots for a service (and optionally one specialist), loaded from the server whenever the choice
 * changes. `slots` is null while loading; `reload` fetches again, e.g. after a slot was taken meanwhile.
 */
export function useFreeSlots(serviceId: string | null, specialistId: string | null) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ key: string; slots: ConsultationSlot[] } | null>(null);
  const key = `${serviceId}|${specialistId}|${version}`;

  useEffect(() => {
    if (!serviceId) return;
    let live = true;
    loadSlots({ serviceId, specialistId }).then(
      (slots) => live && setResult({ key, slots }),
      () => live && setResult({ key, slots: [] }),
    );
    return () => {
      live = false;
    };
  }, [key, serviceId, specialistId]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { slots: result?.key === key ? result.slots : null, reload };
}
