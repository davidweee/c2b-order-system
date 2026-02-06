# C2B订单管理系统

用户端+管理端完整解决方案，支持手机验证码登录、订单创建、图片上传、后台管理等功能。

## 技术栈

- **前端**: React + TypeScript + Vite + TDesign
- **后端**: Node.js + Express + Prisma + JWT
- **数据库**: MySQL
- **部署**: PM2 + Nginx

## 项目结构

```
CHAKEN2B_WEB/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── pages/     # 页面组件
│   │   ├── utils/     # 工具函数
│   │   └── App.tsx    # 应用入口
│   └── package.json
├── backend/           # 后端项目
│   ├── src/
│   │   ├── routes/    # API路由
│   │   └── index.ts   # 服务入口
│   ├── prisma/        # 数据库模型
│   └── package.json
└── deploy.sh          # 部署脚本
```

## 功能模块

### 用户端
- 手机验证码登录（首次登录自动注册）
- 订单创建与编辑（产品选择、公司信息、银行信息、授权信息、证件上传）
- 订单保存（草稿状态，后台不可见）
- 订单提交（生成订单号C2B+8位随机字符，后台可见）
- 订单撤回（已提交但未支付的订单可撤回为草稿状态）
- 历史订单查看

### 管理端
- 管理员登录（独立账号体系）
- 用户管理（查看注册用户和订单统计）
- 订单管理（查看所有已提交订单和上传的图片）
- 状态管理（修改支付状态、交付状态、添加备注）

## 本地开发

### 1. 数据库准备

确保MySQL已安装并运行，密码为`123`。

### 2. 后端启动

```bash
cd backend
npm install
# 生成Prisma Client
npx prisma generate
# 推送数据库模型
npx prisma db push
# 创建管理员账号（可选）
mysql -uroot -p123 c2b_order_system -e "INSERT INTO Admin (username, password) VALUES ('admin', 'admin123');"
# 启动服务
npm run dev
```

### 3. 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问 `http://localhost:5173`

## 部署到腾讯云CVM

服务器信息：
- IP: 43.138.212.116
- SSH用户: root
- SSH密码: Whatrug2d
- MySQL密码: 123

### 部署步骤

1. 安装依赖工具：
```bash
# Windows上安装sshpass
# 或手动上传文件
```

2. 执行部署脚本：
```bash
chmod +x deploy.sh
./deploy.sh
```

3. 或手动部署：
```bash
# 前端构建
cd frontend
npm run build
cd ..

# 后端构建
cd backend
npm run build
cd ..

# 上传到服务器
scp -r frontend/dist root@43.138.212.116:/var/www/c2b-frontend
scp -r backend/dist root@43.138.212.116:/var/www/c2b-backend
scp -r backend/node_modules root@43.138.212.116:/var/www/c2b-backend
scp -r backend/prisma root@43.138.212.116:/var/www/c2b-backend
scp backend/package.json root@43.138.212.116:/var/www/c2b-backend

# SSH登录服务器
ssh root@43.138.212.116

# 在服务器上执行
cd /var/www/c2b-backend
npx prisma generate
npx prisma db push

# 配置Nginx
cat > /etc/nginx/conf.d/c2b.conf << 'EOF'
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
EOF

nginx -t && systemctl restart nginx

# 启动后端
pm2 start node --name c2b-backend -- dist/index.js
pm2 save
```

## API接口

### 用户认证
- POST `/api/auth/send-code` - 发送验证码
- POST `/api/auth/login` - 用户登录
- POST `/api/auth/admin/login` - 管理员登录

### 订单管理
- GET `/api/orders` - 获取订单列表
- POST `/api/orders` - 创建订单
- GET `/api/orders/:id` - 获取订单详情
- PUT `/api/orders/:id` - 更新订单
- POST `/api/orders/:id/submit` - 提交订单
- POST `/api/orders/:id/revoke` - 撤回订单

### 文件上传
- POST `/api/upload/image` - 上传图片

### 管理端
- GET `/api/admin/users` - 获取用户列表
- GET `/api/admin/orders` - 获取订单列表
- GET `/api/admin/orders/:id` - 获取订单详情
- PATCH `/api/admin/orders/:id` - 更新订单状态

## 验证码设置

开发阶段使用固定验证码：`123456`

生产环境需接入真实短信服务（如腾讯云SMS）

## 订单号规则

格式：`C2B` + 8位随机字母数字组合
示例：`C2BA3B9C2D1E`

## 管理员账号

默认管理员：
- 用户名: `admin`
- 密码: `admin123`

部署后在服务器MySQL中执行：
```sql
INSERT INTO Admin (username, password) VALUES ('admin', 'admin123');
```

## 注意事项

1. 图片存储在服务器本地目录 `uploads/`
2. 用户草稿状态订单后台不可见
3. 已支付订单用户无法撤回
4. 开发阶段验证码固定为123456
