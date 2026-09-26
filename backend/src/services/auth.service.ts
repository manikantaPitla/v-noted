import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { verifyGoogleToken, signJwt } from '../lib/auth';
import { seedDefaults } from '../db/seed';

export class AuthService {
  static async googleLogin(credential: string) {
    const googleUser = await verifyGoogleToken(credential);
    const userId = googleUser.googleId;

    const [existingUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!existingUser) {
      console.log(`[auth] New user detected: ${userId}. Seeding default data...`);
      await db.transaction(async (tx) => {
        await tx.insert(users).values({
          id: userId,
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.avatar,
          accentColor: '#818CF8',
          theme: 'dark',
        });
        await seedDefaults(tx, userId);
      });
    } else {
      await db.update(users)
        .set({
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.avatar,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    const token = signJwt({
      userId: googleUser.googleId,
      email: googleUser.email,
      name: googleUser.name,
    });

    const [profile] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return {
      user: {
        id: userId,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.avatar,
        accent_color: profile?.accentColor,
        theme: profile?.theme,
      },
      token,
    };
  }

  static async updateProfile(userId: string, data: { accent_color?: string; theme?: string; name?: string; avatar?: string }) {
    const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!existing) return null;

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (data.accent_color !== undefined) updateFields.accentColor = data.accent_color;
    if (data.theme !== undefined) updateFields.theme = data.theme;
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.avatar !== undefined) updateFields.avatar = data.avatar;

    await db.update(users).set(updateFields).where(eq(users.id, userId));
    const [updated] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return {
      ...updated,
      user_id: updated.id,
      accent_color: updated.accentColor,
      created_at: updated.createdAt?.toISOString(),
      updated_at: updated.updatedAt?.toISOString(),
    };
  }

  static async resetAccount(userId: string, email: string, name: string) {
    await db.transaction(async (tx) => {
      // Preserve user preferences before cascade delete
      const [existing] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      const accentColor = existing?.accentColor || '#818CF8';
      const theme = existing?.theme || 'dark';

      // Delete user — cascades to all data
      await tx.delete(users).where(eq(users.id, userId));

      // Re-create user
      await tx.insert(users).values({
        id: userId,
        email,
        name,
        avatar: existing?.avatar || '',
        accentColor,
        theme,
      });

      await seedDefaults(tx, userId);
    });
    return true;
  }
}
