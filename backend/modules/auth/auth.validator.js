import z from 'zod';

const registerSchema = z.object({

    username: z
        .string()
        .trim()
        .min(3)
        .max(20),

    email: z
        .email()
        .toLowerCase(),

    password: z
        .string()
        .min(8)
        .max(32)

});

const loginSchema = z.object({

    email: z
        .email()
        .toLowerCase(),

    password: z
        .string()
        .min(8)
        .max(32)

});

export {registerSchema, loginSchema};