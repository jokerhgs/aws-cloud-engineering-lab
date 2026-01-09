import { z } from 'zod';

export const UserSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['admin', 'user', 'guest']).default('user'),
    createdAt: z.string().datetime(),
});

export const CreateUserSchema = UserSchema.pick({ name: true, email: true, role: true }).partial({ role: true });
export const UpdateUserSchema = UserSchema.pick({ name: true, email: true, role: true }).partial();

export type User = z.infer<typeof UserSchema>;
export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
