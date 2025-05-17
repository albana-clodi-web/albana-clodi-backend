import { z } from "zod";

export const RegisterSchema = z.object({
	body: z.object({
		email: z.string().email("Email tidak valid"),
		password: z.string().min(6, "Password minimal 6 karakter"),
		name: z.string().min(1, "Nama tidak boleh kosong"),
		role: z.enum(["SUPERADMIN", "ADMIN"], {
			errorMap: () => ({ message: "Role harus SUPERADMIN atau ADMIN" }),
		}),
	}),
});

export const LoginSchema = z.object({
	body: z.object({
		email: z.string().email("Email tidak valid"),
		password: z.string().min(1, "Password tidak boleh kosong"),
	}),
});

export type RegisterType = z.infer<typeof RegisterSchema>;
export type LoginType = z.infer<typeof LoginSchema>;
