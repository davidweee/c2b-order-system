import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

const adminMiddleware = (req: any, res: any, next: any) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        orders: {
          where: { status: 'submitted' },
          select: { id: true, orderNo: true, status: true, payStatus: true, deliveryStatus: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'submitted' },
      include: { 
        user: { select: { id: true, phone: true } },
        images: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { 
        user: { select: { id: true, phone: true } },
        images: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: '获取订单详情失败' });
  }
});

router.patch('/orders/:id', async (req, res) => {
  try {
    const { payStatus, deliveryStatus, remark } = req.body;

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(payStatus && { payStatus }),
        ...(deliveryStatus && { deliveryStatus }),
        ...(remark !== undefined && { remark })
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: '更新订单失败' });
  }
});

export { router };
