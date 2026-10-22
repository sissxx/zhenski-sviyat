"use client";

import { ChoiceCards, type Choice } from "./ChoiceCards";

export type PaymentMethod = "card" | "bank";

type PaymentMethodFieldProps = {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  error?: string;
  /** False until Stripe is connected: the card option is shown as coming soon. */
  cardAvailable?: boolean;
};

/** Card (Stripe) or bank transfer. */
export function PaymentMethodField({ cardAvailable = true, ...props }: PaymentMethodFieldProps) {
  const choices: Choice<PaymentMethod>[] = [
    {
      value: "card",
      label: cardAvailable ? "Карта / онлайн плащане" : "Карта / онлайн плащане — скоро",
      hint: cardAvailable
        ? "Плащаш веднага чрез защитена страница на Stripe."
        : "Плащането с карта ще бъде достъпно съвсем скоро.",
      disabled: !cardAvailable,
    },
    {
      value: "bank",
      label: "Банков превод",
      hint: "Получаваш данни за превод. Мястото се потвърждава, щом плащането пристигне.",
    },
  ];
  return <ChoiceCards legend="Начин на плащане" name="paymentMethod" choices={choices} {...props} />;
}
