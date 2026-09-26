import { Router } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { verifyGoogleToken, signJwt } from '../lib/auth';
import { seedDefaults } from '../db/seed';
import { requireAuth } from '../middleware/auth.middleware';

export const authRouter = Router();

// POST /auth/google — Login or register via Google OAuth
authRouter.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing credential' });

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

    return res.json({
      user: {
        id: userId,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.avatar,
        accent_color: profile?.accentColor,
        theme: profile?.theme,
      },
      token,
    });
  } catch (err) {
    console.error('[auth/google]', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
});

// PUT /auth/profile — Update user preferences (accent color, theme)
authRouter.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const dto = req.body;

    const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Profile not found' });

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.accent_color !== undefined) updateFields.accentColor = dto.accent_color;
    if (dto.theme !== undefined) updateFields.theme = dto.theme;
    if (dto.name !== undefined) updateFields.name = dto.name;
    if (dto.avatar !== undefined) updateFields.avatar = dto.avatar;

    await db.update(users).set(updateFields).where(eq(users.id, userId));

    const [updated] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return res.json({
      ...updated,
      user_id: updated.id,
      accent_color: updated.accentColor,
      created_at: updated.createdAt?.toISOString(),
      updated_at: updated.updatedAt?.toISOString(),
    });
  } catch (err) {
    console.error('[auth/profile]', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /auth/reset — Reset account: delete all data, re-seed defaults
authRouter.post('/reset', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const email = req.userEmail!;
    const name = req.userName!;

    await db.transaction(async (tx) => {
      // Preserve user preferences before cascade delete
      const [existing] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      const accentColor = existing?.accentColor || '#818CF8';
      const theme = existing?.theme || 'dark';

      // Delete user — cascades to all notes, categories, tags, note_tags, presence
      await tx.delete(users).where(eq(users.id, userId));

      // Re-create user with preserved preferences
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

    return res.json({ success: true, message: 'Account reset and re-seeded' });
  } catch (err) {
    console.error('[auth/reset]', err);
    return res.status(500).json({ error: 'Failed to reset account' });
  }
});
