# DADN - Smart Room Management

Hệ thống gồm 4 phần: PostgreSQL, backend NestJS, web React/Vite, mobile Expo và Python AI service.

## Cần có

- Node.js + npm
- Docker Desktop
- Python
- Expo Go trên điện thoại

## Chạy backend

```powershell
cd "D:\Project C\DADN\backend"
npm install
docker compose up -d
npm run start:dev
```

Backend chạy tại:

```text
http://localhost:3000/api
http://localhost:3000/api/docs
```

## Chạy Python AI

```powershell
cd "D:\Project C\DADN\backend\AI"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

AI chạy tại:

```text
http://localhost:8001/ai
```

## Chạy web

```powershell
cd "D:\Project C\DADN\frontend"
npm install
npm run dev
```

Web chạy tại:

```text
http://localhost:5173
```

## Chạy mobile bằng Expo

Điện thoại không dùng được `localhost` của laptop. Trước khi chạy Expo, lấy IP LAN của laptop:

```powershell
Get-NetIPConfiguration |
  Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up' } |
  Select-Object -ExpandProperty IPv4Address |
  Select-Object IPAddress,PrefixLength
```

Ví dụ IP lấy được là `192.168.1.10`, chạy:

```powershell
cd "D:\Project C\DADN\mobile"
npm install
$env:EXPO_PUBLIC_API_URL="http://192.168.1.10:3000/api"
npx expo start --host lan --clear
```

Sau đó mở Expo Go trên điện thoại và quét QR.

Nếu app mobile báo lỗi mạng, kiểm tra lại:

- Điện thoại và laptop đang cùng Wi-Fi.
- Mobile đang dùng `EXPO_PUBLIC_API_URL=http://<IP_LAN_LAPTOP>:3000/api`, không phải `localhost`.
- Trên điện thoại mở thử `http://<IP_LAN_LAPTOP>:3000/api/docs`.
- Nếu vẫn lỗi, kiểm tra Windows Firewall.

## Tài khoản test

```text
owner      / owner123
admin01    / admin123
manager101 / admin123
tenant101  / tenant123
tenant102  / tenant123
tenant201  / tenant123
```

## Tài liệu thêm

- `docs/run.md`: hướng dẫn chạy chi tiết.
- `docs/API.md`: danh sách API backend.
- `docs/tested.md`: các luồng smoke test chính.
