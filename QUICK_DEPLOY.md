# 快速部署指南 - C2B订单管理系统

由于本地环境限制，请在服务器上完成构建和部署步骤。

## 方案一：直接在服务器上开发（推荐）

### 1. SSH登录服务器

```bash
ssh root@43.138.212.116
# 密码: Whatrug2d
```

### 2. 安装必要软件

```bash
# 安装Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装MySQL（如果未安装）
yum install -y mysql-server
systemctl start mysqld
systemctl enable mysqld

# 设置MySQL密码为123
mysql_secure_installation
# 按提示设置root密码为123

# 安装Nginx
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# 安装PM2
npm install -g pm2

# 安装Git
yum install -y git
```

### 3. 克隆或上传项目

**方式A：从Git克隆（如果有仓库）**
```bash
cd /var/www
git clone <your-repo-url> c2b-system
cd c2b-system
```

**方式B：本地上传压缩包**
```bash
# 本地打包
cd d:/Programming/CHAKEN2B_WEB
tar -czf c2b-system.tar.gz ./

# 上传到服务器
scp c2b-system.tar.gz root@43.138.212.116:/var/www/

# SSH登录服务器解压
cd /var/www
tar -xzf c2b-system.tar.gz
```

### 4. 后端配置和启动

```bash
cd /var/www/c2b-system/backend

# 安装依赖
npm install

# 安装全局依赖
npm install -g typescript ts-node prisma

# 创建数据库
mysql -uroot -p123 -e "CREATE DATABASE IF NOT EXISTS c2b_order_system CHARACTER SET utf8mb4;"

# 生成Prisma Client
npx prisma generate

# 推送数据库表结构
npx prisma db push

# 创建管理员账号
mysql -uroot -p123 c2b_order_system -e "INSERT INTO Admin (username, password) VALUES ('admin', 'admin123');"

# 编译TypeScript
npx tsc

# 创建uploads目录
mkdir -p uploads

# 启动后端
pm2 start dist/index.js --name c2b-backend
pm2 logs c2b-backend  # 查看日志确认启动成功
pm2 save
pm2 startup
```

### 5. 前端配置和构建

```bash
cd /var/www/c2b-system/frontend

# 安装依赖
npm install

# 设置生产环境API地址
cat > .env.production << 'EOF'
VITE_API_URL=http://43.138.212.116
EOF

# 构建前端
npm run build

# 部署到Nginx
mkdir -p /var/www/c2b-frontend
cp -r dist/* /var/www/c2b-frontend/
```

### 6. 配置Nginx

```bash
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
        alias /var/www/c2b-system/backend/uploads;
        expires 30d;
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

### 7. 配置防火墙

```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# 或者临时关闭防火墙测试
systemctl stop firewalld
```

### 8. 验证部署

```bash
# 测试后端API
curl http://localhost:3001/api/health

# 查看PM2状态
pm2 status

# 查看Nginx状态
systemctl status nginx
```

### 9. 访问应用

**前端地址**: http://43.138.212.116

**管理员登录**:
- 用户名: admin
- 密码: admin123

**用户登录**:
- 手机号: 任意11位手机号
- 验证码: 123456（开发阶段固定）

## 方案二：使用Docker部署（可选）

如果服务器已安装Docker：

```bash
# SSH登录服务器
ssh root@43.138.212.116

# 创建docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: c2b-mysql
    environment:
      MYSQL_ROOT_PASSWORD: 123
      MYSQL_DATABASE: c2b_order_system
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - c2b-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: c2b-backend
    ports:
      - "3001:3001"
    environment:
      DB_URL: mysql://root:123@mysql:3306/c2b_order_system
      JWT_SECRET: your-secret-key-change-in-production
      PORT: 3001
    depends_on:
      - mysql
    networks:
      - c2b-network
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: c2b-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - c2b-network

volumes:
  mysql-data:

networks:
  c2b-network:
    driver: bridge
EOF

# 启动所有服务
docker-compose up -d
```

## 故障排除

### 后端无法启动

```bash
# 查看PM2日志
pm2 logs c2b-backend

# 手动测试
cd /var/www/c2b-system/backend
node dist/index.js
```

### 数据库连接失败

```bash
# 测试MySQL连接
mysql -uroot -p123 -e "SHOW DATABASES;"

# 检查数据库创建
mysql -uroot -p123 -e "USE c2b_order_system; SHOW TABLES;"
```

### Prisma生成失败

```bash
cd /var/www/c2b-system/backend
npx prisma generate --schema=./prisma/schema.prisma
```

### Nginx 502错误

```bash
# 检查后端是否运行
curl http://localhost:3001/api/health

# 检查Nginx配置
nginx -t

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log
```

### 图片上传失败

```bash
# 检查uploads目录权限
chmod 755 /var/www/c2b-system/backend/uploads
chown -R nginx:nginx /var/www/c2b-system/backend/uploads
```

## 维护命令

### 重启服务
```bash
pm2 restart c2b-backend
systemctl restart nginx
```

### 查看日志
```bash
pm2 logs c2b-backend
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 更新代码
```bash
cd /var/www/c2b-system
git pull
# 或重新上传

cd backend && npm run build && pm2 restart c2b-backend
cd ../frontend && npm run build && cp -r dist/* /var/www/c2b-frontend/
```

### 备份数据库
```bash
mysqldump -uroot -p123 c2b_order_system > backup_$(date +%Y%m%d).sql
```

## 安全建议

1. 修改默认密码
2. 使用HTTPS（Let's Encrypt证书）
3. 配置防火墙规则
4. 定期备份数据
5. 使用生产级验证码服务

## 项目已完成的文件

### 后端
- ✅ src/index.ts - Express服务器入口
- ✅ src/routes/auth.ts - 认证路由
- ✅ src/routes/orders.ts - 订单路由
- ✅ src/routes/users.ts - 用户路由
- ✅ src/routes/admin.ts - 管理员路由
- ✅ src/routes/upload.ts - 文件上传路由
- ✅ prisma/schema.prisma - 数据库模型
- ✅ package.json - 依赖配置

### 前端
- ✅ src/App.tsx - 应用入口和路由配置
- ✅ src/main.tsx - 渲染入口
- ✅ src/pages/Login.tsx - 用户登录页
- ✅ src/pages/AdminLogin.tsx - 管理员登录页
- ✅ src/pages/OrderList.tsx - 订单列表
- ✅ src/pages/OrderCreate.tsx - 创建订单
- ✅ src/pages/OrderDetail.tsx - 订单详情
- ✅ src/pages/AdminDashboard.tsx - 管理后台
- ✅ src/pages/AdminOrderDetail.tsx - 管理端订单详情
- ✅ src/utils/api.ts - API封装

所有代码已完成，请在服务器上按照本指南部署。
