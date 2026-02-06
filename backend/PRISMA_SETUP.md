# Prisma Client 自动生成说明

由于Prisma在Windows环境下可能存在路径识别问题，已采取以下解决方案：

## 方案1：手动生成Prisma Client

在backend目录下运行：
```bash
cd backend
npx prisma generate --schema=schema.prisma
```

## 方案2：使用package.json配置

在package.json中添加：
```json
{
  "prisma": {
    "schema": "./schema.prisma"
  }
}
```

然后运行：
```bash
cd backend
npx prisma generate
```

## 方案3：手动复制schema文件

```bash
cd backend
cp prisma/schema.prisma ./schema.prisma
npx prisma generate
```

## 当前项目状态

已创建：
- ✅ Prisma Schema文件 (backend/prisma/schema.prisma 和 backend/schema.prisma)
- ✅ 数据库模型定义
- ✅ 所有后端路由和接口

待完成（在服务器上）：
- 运行 `npx prisma generate` 生成Prisma Client
- 运行 `npx prisma db push` 创建数据库表
- 创建管理员账号

## 部署时的完整步骤

1. 在服务器上执行：
```bash
cd /var/www/c2b-backend
npx prisma generate
npx prisma db push
mysql -uroot -p123 c2b_order_system -e "INSERT INTO Admin (username, password) VALUES ('admin', 'admin123');"
```

2. 确保数据库已创建：
```bash
mysql -uroot -p123 -e "CREATE DATABASE IF NOT EXISTS c2b_order_system;"
```
