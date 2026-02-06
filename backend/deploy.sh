#!/bin/bash

# C2B订单管理系统部署脚本

echo "开始部署到腾讯云CVM..."

# 前端构建
cd frontend
npm run build
cd ..

# 后端打包
cd backend
npm run build
cd ..

# 创建部署目录
SSH_CMD="sshpass -p 'Whatrug2d' ssh -o StrictHostKeyChecking=no root@43.138.212.116"

# 上传文件
echo "上传文件到服务器..."
sshpass -p 'Whatrug2d' scp -o StrictHostKeyChecking=no -r frontend/dist root@43.138.212.116:/var/www/c2b-frontend
sshpass -p 'Whatrug2d' scp -o StrictHostKeyChecking=no -r backend/dist root@43.138.212.116:/var/www/c2b-backend
sshpass -p 'Whatrug2d' scp -o StrictHostKeyChecking=no -r backend/node_modules root@43.138.212.116:/var/www/c2b-backend
sshpass -p 'Whatrug2d' scp -o StrictHostKeyChecking=no -r backend/prisma root@43.138.212.116:/var/www/c2b-backend
sshpass -p 'Whatrug2d' scp -o StrictHostKeyChecking=no backend/package.json root@43.138.212.116:/var/www/c2b-backend

# 在服务器上配置
echo "配置服务器环境..."
sshpass -p 'Whatrug2d' ssh -o StrictHostKeyChecking=no root@43.138.212.116 << 'EOF'
# 安装PM2
npm install -g pm2

# 创建数据库
mysql -uroot -p123 -e "CREATE DATABASE IF NOT EXISTS c2b_order_system;"

# 初始化数据库
cd /var/www/c2b-backend
npx prisma generate
npx prisma db push

# 创建管理员账号
mysql -uroot -p123 c2b_order_system -e "INSERT INTO Admin (username, password) VALUES ('admin', 'admin123');"

# 配置Nginx
cat > /etc/nginx/conf.d/c2b.conf << 'NGINX'
server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location / {
        root /var/www/c2b-frontend;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/c2b-backend/uploads;
        expires 30d;
    }
}
NGINX

# 重启Nginx
nginx -t && systemctl restart nginx

# 启动后端服务
pm2 delete c2b-backend 2>/dev/null || true
pm2 start node --name c2b-backend -- dist/index.js
pm2 save
pm2 startup

echo "部署完成！"
echo "前端地址: http://43.138.212.116"
echo "后端API: http://43.138.212.116/api"
echo "管理员账号: admin / admin123"
echo ""
echo "用户登录验证码（开发阶段）: 123456"
EOF

echo "部署脚本执行完成"
