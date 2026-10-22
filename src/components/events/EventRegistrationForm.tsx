"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ConsentCheckbox } from "@/components/forms/ConsentCheckbox";
import { FormTextField } from "@/components/forms/FormTextField";
import { PaymentMethodField } from "@/components/forms/PaymentMethodField";
import { consent, email, fullName, phone } from "@/lib/validation";
import { eventConfirmationPath } from "@/lib/routes";

const schema = z.object({
  name: fullName,
  email,
  phone,
  paymentMethod: z.enum(["card", "bank"]),
  consent,
});

type RegistrationValues = z.infer<typeof schema>;

type EventRegistrationFormProps = { slug: string; paid: boolean };

/**
 * Event sign-up. UI only for now: a valid submit goes straight to the
 * confirmation screen. Once Supabase and Stripe are connected, card payments
 * will go through Stripe Checkout and bank transfers will wait for an admin.
 */
export function EventRegistrationForm({ slug, paid }: EventRegistrationFormProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", paymentMethod: "card", consent: false },
  });

  const onSubmit = (values: RegistrationValues) => {
    const payment = paid ? values.paymentMethod : "free";
    router.push(`${eventConfirmationPath(slug)}?plashtane=${payment}`);
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2.25, width: "100%" }}
    >
      <FormTextField label="Име и фамилия" placeholder="Въведи името си" autoComplete="name" registration={register("name")} error={errors.name} />
      <FormTextField
        label="Имейл"
        type="email"
        placeholder="name@example.com"
        autoComplete="email"
        registration={register("email")}
        error={errors.email}
      />
      <FormTextField
        label="Телефон"
        type="tel"
        placeholder="Телефон за връзка"
        autoComplete="tel"
        registration={register("phone")}
        error={errors.phone}
      />
      {paid && (
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field, fieldState }) => (
            <PaymentMethodField value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
          )}
        />
      )}
      <ConsentCheckbox registration={register("consent")} error={errors.consent} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ minWidth: 260 }}>
          {paid ? "Продължи към плащане" : "Запиши се"}
        </Button>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Записването и плащанията все още не са свързани. Бутонът показва как ще изглежда потвърждението.
        </Typography>
      </Box>
    </Box>
  );
}
