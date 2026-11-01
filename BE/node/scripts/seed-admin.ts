// Creates the super admin from ADMIN_* values in BE/.env, or promotes that user if they already exist.
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import '../src/config.js';
import { createUser, findUserByEmail, updateRole } from '../src/repositories/users.js';
import { BCRYPT_ROUNDS } from '../src/routes/auth.js';
import { nowIso } from '../src/time.js';
import { registerSchema } from '../src/validation.js';

const input = registerSchema.parse({
  name: process.env.ADMIN_NAME ?? 'Admin',
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  phone: process.env.ADMIN_PHONE,
});

const existing = await findUserByEmail(input.email);
if (existing?.role === 'superadmin') {
  console.log(`${input.email} is already a super admin. Nothing to do.`);
} else if (existing) {
  await updateRole(existing.id, 'superadmin');
  console.log(`${input.email} promoted from ${existing.role} to superadmin.`);
} else {
  const now = nowIso();
  await createUser({
    id: randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
    phone: input.phone,
    role: 'superadmin',
    status: 'active',
    wins: 0,
    losses: 0,
    draws: 0,
    mustChangePassword: false,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`Super admin ${input.email} created.`);
}
