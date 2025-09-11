import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide"),
  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const registerSchema = z
  .object({
    userType: z.enum(["client", "mairie"]),
    email: z
      .string()
      .min(1, "L'email est requis")
      .email("Format d'email invalide"),
    password: z
      .string()
      .min(1, "Le mot de passe est requis")
      .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z
      .string()
      .min(1, "La confirmation du mot de passe est requise"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    birthDate: z.string().optional(),
    mairieName: z.string().optional(),
    streetNumber: z.string().optional(),
    streetName: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.userType === "client") {
        return data.firstName && data.lastName && data.birthDate;
      }
      if (data.userType === "mairie") {
        return (
          data.mairieName &&
          data.streetNumber &&
          data.streetName &&
          data.postalCode &&
          data.city
        );
      }
      return true;
    },
    {
      message: "Tous les champs requis doivent être remplis",
      path: ["userType"],
    }
  );

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;