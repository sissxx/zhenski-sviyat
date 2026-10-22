"use client";

import { ChoiceCards, type Choice } from "./ChoiceCards";

export type PaymentMethod = "card" | "bank";

type PaymentMethodFieldProps = {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  error?: string;
  /** False until Stripe is connected: the card option is shown as coming soon. */
  cardAvailable?: boolean;
  /** False when only card payments are accepted. */
  bankAvailable?: boolean;
};

/** Card (Stripe) or bank transfer. */
export function PaymentMethodField({ cardAvailable = true, bankAvailable = true, ...props }: PaymentMethodFieldProps) {
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
      label: bankAvailable ? "Банков превод" : "Банков превод — не е възможен тук",
      hint: bankAvailable
        ? "Получаваш данни за превод. Потвърждаваме, щом плащането пристигне."
        : "Тук се приема само плащане с карта.",
      disabled: !bankAvailable,
    },
  ];
  return <ChoiceCards legend="Начин на плащане" name="paymentMethod" choices={choices} {...props} />;
}
