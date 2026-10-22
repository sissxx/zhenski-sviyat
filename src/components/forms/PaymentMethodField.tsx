"use client";

import { ChoiceCards, type Choice } from "./ChoiceCards";

export type PaymentMethod = "card" | "bank";

const choices: Choice<PaymentMethod>[] = [
  { value: "card", label: "Карта / онлайн плащане", hint: "Плащаш веднага чрез защитена страница на Stripe." },
  { value: "bank", label: "Банков превод", hint: "Получаваш данни за превод. Мястото се потвърждава, щом плащането пристигне." },
];

type PaymentMethodFieldProps = { value: PaymentMethod; onChange: (value: PaymentMethod) => void; error?: string };

/** Card (Stripe) or bank transfer. */
export function PaymentMethodField(props: PaymentMethodFieldProps) {
  return <ChoiceCards legend="Начин на плащане" name="paymentMethod" choices={choices} {...props} />;
}
