# C2B订单管理系统 - 手动部署指南

由于自动化部署需要额外依赖，本指南提供完整的手动部署步骤。

## 服务器信息

- **IP地址**: 
- **SSH用户**:
- **SSH密码**: 
- **MySQL密码**: 

## 第一步：准备本地项目

### 1.1 前端构建

```bash
cd frontend
npm install
npm run build
```

### 1.2 后端构建

```bash
cd backend
npm install
npm run build
```

## 第二步：上传文件到服务器

使用SCP或SFTP工具将以下目录上传到服务器：

### 上传文件列表：

```
本地路径                          服务器路径
------------------------------------------------------------------
frontend/dist/*                ->  /var/www/c2b-frontend/
backend/dist/*                 ->  /var/www/c2b-backend/
backend/node_modules/*         ->  /var/www/c2b-backend/node_modules/
backend/prisma/*               ->  /var/www/c2b-backend/prisma/
backend/package.json           ->  /var/www/c2b-backend/package.json
backend/schema.prisma          ->  /var/www/c2b-backend/schema.prisma
```

### 使用SCP命令示例：

```bash
# 创建远程目录（可选，SSH登录后操作）
ssh root@43.138.212.116 "mkdir -p /var/www/c2b-frontend /var/www/c2b-backend"

# 上传前端
scp -r frontend/dist/* root@43.138.212.116:/var/www/c2b-frontend/

# 上传后端
scp -r backend/dist root@43.138.212.116:/var/www/c2b-backend/
scp -r backend/node_modules root@43.138.212.116:/var/www/c2b-backend/
scp -r backend/prisma root@43.138.212.116:/var/www/c2b-backend/
scp backend/package.json root@43.138.212.116:/var/www/c2b-backend/
scp backend/schema.prisma root@43.138.212.116:/var/www/c2b-backend/
```

## 第三步：SSH登录服务器配置环境

```bash
ssh root@43.138.212.116
```

### 3.1 安装依赖

```bash
# 更新系统
yum update -y

# 安装Node.js (如果未安装)
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装PM2
npm install -g pm2

# 安装Nginx (如果未安装)
yum install -y nginx

# 启动Nginx
systemctl start nginx
systemctl enable nginx
```

### 3.2 配置数据库

```bash
# 创建数据库
mysql -uroot -p123 -e "CREATE DATABASE IF NOT EXISTS c2b_order_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 验证数据库
mysql -uroot -p123 -e "SHOW DATABASES;"
```

### 3.3 配置后端

```bash
cd /var/www/c2b-backend

# 生成Prisma Client
npx prisma generate

# 推送数据库模型
npx prisma db push

# 创建管理员账号
mysql -uroot -p123 c2b_order_system << 'EOF'
INSERT INTO Admin (username, password) VALUES ('admin', 'admin123');
EOF

# 创建uploads目录
mkdir -p uploads

# 设置环境变量（可选，默认已配置）
cat > .env << 'EOF'
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
DB_URL=mysql://root:123@localhost:3306/c2b_order_system
EOF
```

### 3.4 测试后端

```bash
# 手动测试
node dist/index.js
```

按Ctrl+C停止，然后使用PM2启动：

```bash
# 使用PM2启动
pm2 start dist/index.js --name c2b-backend

# 查看日志
pm2 logs c2b-backend

# 设置开机自启
pm2 save
pm2 startup
```

### 3.5 配置Nginx

```bash
# 创建配置文件
cat > /etc/nginx/conf.d/c2b.conf << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location / {
        root /var/www/c2b-frontend;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/c2b-backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx
```

### 3.6 配置防火墙（如果需要）

```bash
# 开放80端口
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# 或关闭防火墙（不推荐）
systemctl stop firewalld
systemctl disable firewalld
```

## 第四步：验证部署

### 4.1 测试后端API

```bash
curl http://localhost:3001/api/health
# 应返回: {"status":"ok","message":"C2B Order System API is running"}
```

### 4.2 访问前端

浏览器访问: `http://43.138.212.116`

### 4.3 测试登录

**用户端:**
- 输入手机号: 13800138000
- 获取验证码（开发阶段显示为: 123456）
- 输入验证码: 123456
- 登录成功

**管理端:**
- 点击"管理员登录"
- 用户名: admin
- 密码: admin123

## 常见问题

### 1. Prisma生成失败

```bash
cd /var/www/c2b-backend
rm -rf node_modules/@prisma/client
npx prisma generate
```

### 2. 数据库连接失败

检查MySQL是否运行:
```bash
systemctl status mysql
# 或
systemctl status mysqld
```

### 3. PM2进程无法启动

查看日志:
```bash
pm2 logs c2b-backend
pm2 delete c2b-backend
pm2 start dist/index.js --name c2b-backend
```

### 4. Nginx配置错误

测试配置:
```bash
nginx -t
# 修改配置后
systemctl restart nginx
```

### 5. 图片上传失败

检查uploads目录权限:
```bash
chmod 755 /var/www/c2b-backend/uploads
chown -R nginx:nginx /var/www/c2b-backend/uploads
```

## 维护命令

### 查看后端日志
```bash
pm2 logs c2b-backend
```

### 重启后端
```bash
pm2 restart c2b-backend
```

### 查看Nginx日志
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### 查看MySQL
```bash
mysql -uroot -p123 c2b_order_system
SHOW TABLES;
SELECT * FROM Admin;
SELECT * FROM User;
SELECT * FROM Order;
```

### PM2管理
```bash
pm2 list
pm2 monit
pm2 logs
pm2 stop c2b-backend
pm2 delete c2b-backend
```

## 更新部署

当需要更新代码时：

1. 本地重新构建:
```bash
cd frontend && npm run build
cd ../backend && npm run build
```

2. 上传新文件:
```bash
scp -r frontend/dist/* root@43.138.212.116:/var/www/c2b-frontend/
scp -r backend/dist root@43.138.212.116:/var/www/c2b-backend/
```

3. 重启服务:
```bash
ssh root@43.138.212.116
pm2 restart c2b-backend
systemctl reload nginx
```

## 备份数据库

```bash
# 备份
mysqldump -uroot -p123 c2b_order_system > backup_$(date +%Y%m%d).sql

# 恢复
mysql -uroot -p123 c2b_order_system < backup_20260206.sql
```

## 安全建议

1. 修改默认管理员密码
2. 修改JWT_SECRET为随机字符串
3. 启用HTTPS（使用Let's Encrypt）
4. 配置防火墙规则
5. 定期备份数据库
6. 使用生产级验证码服务

## 联系支持

如有问题，请检查：
- PM2日志: `pm2 logs c2b-backend`
- Nginx日志: `/var/log/nginx/error.log`
- 数据库连接: `mysql -uroot -p123`
