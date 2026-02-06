import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.post('/', async (req: any, res) => {
  try {
    const {
      isInitial,
      quantity,
      companyName,
      creditCode,
      bankName,
      bankAccount,
      authName,
      authPhone,
      authIdcard,
      status
    } = req.body;

    const order = await prisma.order.create({
      data: {
        userId: req.userId,
        isInitial,
        quantity,
        companyName,
        creditCode,
        bankName,
        bankAccount,
        authName,
        authPhone,
        authIdcard,
        status: status || 'draft'
      }
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: '创建订单失败' });
  }
});

router.get('/', async (req: any, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      include: { images: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

router.get('/:id', async (req: any, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.userId
      },
      include: { images: true }
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: '获取订单详情失败' });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.userId
      }
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: '更新订单失败' });
  }
});

router.post('/:id/submit', async (req: any, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.userId
      }
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status === 'submitted') {
      return res.status(400).json({ error: '订单已提交' });
    }

    const generateOrderNo = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = 'C2B';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const orderNo = generateOrderNo();

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'submitted',
        orderNo
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: '提交订单失败' });
  }
});

router.post('/:id/revoke', async (req: any, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.userId
      }
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status !== 'submitted') {
      return res.status(400).json({ error: '只能撤回已提交的订单' });
    }

    if (order.payStatus === 'paid') {
      return res.status(400).json({ error: '已支付的订单不能撤回' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'draft'
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: '撤回订单失败' });
  }
});

export { router };
