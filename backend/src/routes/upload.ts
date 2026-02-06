import express from 'express';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片格式'));
    }
  }
});

router.post('/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有文件上传' });
    }

    const { orderId, type } = req.body;

    if (!orderId || !type) {
      return res.status(400).json({ error: '缺少订单ID或图片类型' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const image = await prisma.image.create({
      data: {
        orderId: parseInt(orderId),
        type,
        url: imageUrl
      }
    });

    res.json({ url: imageUrl, image });
  } catch (error) {
    res.status(500).json({ error: '图片上传失败' });
  }
});

router.delete('/image/:id', async (req, res) => {
  try {
    const image = await prisma.image.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!image) {
      return res.status(404).json({ error: '图片不存在' });
    }

    const filePath = path.join(process.cwd(), image.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.image.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: '图片删除成功' });
  } catch (error) {
    res.status(500).json({ error: '图片删除失败' });
  }
});

export { router };
