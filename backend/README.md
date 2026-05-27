# DADN Backend

NestJS API trung tâm cho Rental Smart Room Management.

## Chạy local

```bash
cp .env.example .env
docker compose up -d
npm install
npm run start:dev
```

- API: `http://localhost:3000/api`
- Health: `http://localhost:3000/api/health`
- pgAdmin: `http://localhost:5050` (`admin@example.com` / `admin123`)

Python AI chạy riêng ở `AI_SERVICE_URL`, mặc định `http://localhost:8001/ai`. Web/mobile chỉ gọi NestJS.
