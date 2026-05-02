# 🏠 Yolo:Home – Hệ thống nhà thông minh tích hợp AI và IoT

![Platform](https://img.shields.io/badge/Platform-ESP32%20%2F%20Yolo%3ABit-blue)
![Protocol](https://img.shields.io/badge/Protocol-MQTT-orange)
![AI](https://img.shields.io/badge/AI-Google%20Teachable%20Machine-brightgreen)
![Language](https://img.shields.io/badge/Language-MicroPython%20%7C%20Python-yellow)

---

## 1. Giới thiệu tổng quan

**Yolo:Home** là một dự án **AIoT (AI + IoT)** toàn diện, kết hợp sức mạnh của trí tuệ nhân tạo và khả năng kết nối vạn vật để tạo ra một không gian sống thông minh, tự hành. Dự án không chỉ dừng lại ở việc tự động hóa các thiết bị mà còn tập trung vào việc nhận diện hành vi và danh tính người dùng thông qua giọng nói và hình ảnh.

---

## 2. Các tính năng cốt lõi (User Requirements)

| # | Tính năng | Mô tả |
|---|-----------|-------|
| 🌡️ | **Giám sát môi trường** | Tự động đo lường nhiệt độ, độ ẩm không khí (cảm biến DHT20) và cường độ ánh sáng theo thời gian thực. |
| 🔐 | **Cửa mật mã bảo mật** | Hệ thống khóa cửa sử dụng mật mã nhập từ Remote hồng ngoại, hỗ trợ thay đổi mật mã và quản lý trạng thái máy (biến `STATUS`). |
| 🤖 | **Nhận diện khuôn mặt (FaceAI)** | Sử dụng mô hình Machine Learning để nhận dạng chủ nhà và tự động kích hoạt lệnh mở cửa. |
| 🎙️ | **Trợ lý ảo giọng nói** | Điều khiển thiết bị rảnh tay bằng các khẩu lệnh tiếng Việt thông qua bộ lọc từ khóa thông minh. |
| 🔔 | **Cảnh báo & Tự động hóa** | Tự động bật đèn khi phát hiện chuyển động (cảm biến PIR) và gửi thông báo khẩn cấp. |

---

## 3. Tech Stack

### 🔧 Phần cứng (Hardware)
- **Bộ xử lý trung tâm:** Mạch lập trình Yolo:Bit (Nền tảng chip ESP32).
- **Thiết bị ngoại vi:** Cảm biến DHT20, PIR, ánh sáng, màn hình LCD 1602 (I2C), động cơ RC Servo, quạt mini, LED RGB.

### 💻 Phần mềm & Hệ thống
- **Frontend:** React 19 + Vite + Recharts
- **Backend:** Python Flask + Flask-CORS + python-dotenv
- **Cloud/IoT:** Adafruit IO (MQTT / REST API)
- **AI:** Google Teachable Machine (khuôn mặt & giọng nói)

---

## 4. Cấu trúc thư mục

```
Yolo-home/
├── backend/
│   ├── .env                 # ← tạo từ .env.example (không commit)
│   ├── .env.example
│   ├── app.py
│   ├── requirements.txt
│   ├── routes/
│   └── utils/
├── frontend/
│   ├── .env                 # ← tạo từ .env.example (không commit)
│   ├── .env.example
│   ├── src/
│   └── package.json
└── mockup/
```

---

## 5. Hướng dẫn cài đặt & chạy

### Yêu cầu
- Python 3.10+
- Node.js 18+

---

### Backend (Flask)

```bash
cd backend

# 1. Tạo và kích hoạt virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 2. Cài dependencies
pip install -r requirements.txt

# 3. Tạo file .env
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux

# 4. Điền thông tin Adafruit vào .env (xem mục 6)

# 5. Chạy server
python app.py
# → http://localhost:5000
```

---

### Frontend (React/Vite)

```bash
cd frontend

# 1. Cài dependencies
npm install

# 2. Tạo file .env
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux

# 3. Chạy dev server
npm run dev
# → http://localhost:5173
```

> **Lưu ý:** Frontend tự proxy `/api/*` sang `http://localhost:5000` — chỉ cần chạy cả hai cùng lúc.

---

## 6. Biến môi trường

### `backend/.env`

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `ADAFRUIT_USERNAME` | Username Adafruit IO | `Bong_Bong` |
| `ADAFRUIT_API_KEY` | API Key Adafruit IO | `aio_xxxx...` |
| `ADAFRUIT_DASHBOARD_KEY` | Key của dashboard | `nothing` |
| `FLASK_PORT` | Port Flask server | `5000` |

### `frontend/.env`

| Biến | Mô tả | Mặc định |
|------|-------|---------|
| `VITE_API_BASE_URL` | URL backend (dùng cho proxy) | `http://localhost:5000` |

> API Key Adafruit lấy tại: **io.adafruit.com → My Key** (góc phải trên).

---

## 7. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│         ☁️  Lớp ứng dụng (Cloud & App Layer)            │
│   Adafruit IO · React Frontend · Flask Backend          │
└──────────────────────────┬──────────────────────────────┘
                           │ MQTT / REST
┌──────────────────────────▼──────────────────────────────┐
│          🖥️  Lớp trung gian (Gateway Layer)              │
│   Flask · AI Inference · Adafruit API                   │
└──────────────────────────┬──────────────────────────────┘
                           │ WiFi (MQTT)
┌──────────────────────────▼──────────────────────────────┐
│            📡  Lớp thiết bị (Edge Layer)                 │
│   Yolo:Bit · Cảm biến · Động cơ · Đèn · Servo           │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Đội ngũ thực hiện

| Vai trò | Trách nhiệm |
|---------|-------------|
| 🔧 **Hardware Lead** | Kết nối mạch, sensor và logic nhúng. |
| 🤖 **AI & Gateway Expert** | Script Python, xử lý Serial và huấn luyện mô hình ML. |
| ☁️ **Backend Developer** | Flask API, Adafruit IO integration. |
| 🎨 **Frontend Developer** | React Dashboard UI/UX. |

---

<div align="center">
  <sub>© 2026 Yolo:Home Project – Powered by OhStem & ESP32</sub>
</div>
