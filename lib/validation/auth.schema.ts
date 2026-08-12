import {z} from "zod";

export const signUpSchema = z.object({
    email: z.email("A valid email address is required").trim().toLowerCase(),
    password: z
    .string()
    .min(8, "Password must be atleast 8 characters")
    .max(20, "Password must be less than 20 characters")
});

export const loginSchema = z.object({
    email: z.email("A valid email address is required").trim().toLowerCase(),
    password: z.string().min(1, "Password is required"),
});