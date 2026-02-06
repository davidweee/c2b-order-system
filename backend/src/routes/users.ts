import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/profile', async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

export { router };
