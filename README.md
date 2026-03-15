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

Dựa trên yêu cầu hệ thống, dự án hiện thực **5 module chức năng chính**:

| # | Tính năng | Mô tả |
|---|-----------|-------|
| 🌡️ | **Giám sát môi trường** | Tự động đo lường nhiệt độ, độ ẩm không khí (cảm biến DHT20) và cường độ ánh sáng theo thời gian thực. |
| 🔐 | **Cửa mật mã bảo mật** | Hệ thống khóa cửa sử dụng mật mã nhập từ Remote hồng ngoại, hỗ trợ thay đổi mật mã và quản lý trạng thái máy (biến `STATUS`). |
| 🤖 | **Nhận diện khuôn mặt (FaceAI)** | Sử dụng mô hình Machine Learning để nhận dạng chủ nhà và tự động kích hoạt lệnh mở cửa. |
| 🎙️ | **Trợ lý ảo giọng nói** | Điều khiển thiết bị rảnh tay bằng các khẩu lệnh tiếng Việt thông qua bộ lọc từ khóa thông minh. |
| 🔔 | **Cảnh báo & Tự động hóa** | Tự động bật đèn khi phát hiện chuyển động (cảm biến PIR) và gửi thông báo khẩn cấp qua Telegram. |

---

## 3. Tech Stack (Danh sách công nghệ)

### 🔧 Phần cứng (Hardware)

- **Bộ xử lý trung tâm:** Mạch lập trình Yolo:Bit (Nền tảng chip ESP32).
- **Thiết bị ngoại vi:** Mạch mở rộng, cảm biến DHT20, cảm biến PIR, cảm biến ánh sáng, màn hình LCD 1602 (I2C), động cơ RC Servo, quạt mini và LED RGB.

### 💻 Phần mềm & Hệ thống (Software & System)

- **Ngôn ngữ lập trình:** Blockly (OhStem App), MicroPython và Python (cho IoT Gateway).
- **Giao thức kết nối:** MQTT (Publish/Subscribe) để đồng bộ hóa dữ liệu giữa thiết bị và server.
- **Hạ tầng Cloud:** OhStem Server (hoặc Adafruit IO) kết hợp Cơ sở dữ liệu lưu trữ lịch sử.
- **Trí tuệ nhân tạo:** Google Teachable Machine tích hợp nhận diện hình ảnh và giọng nói.

---

## 4. Kiến trúc hệ thống (System Architecture)

Hệ thống được tổ chức theo cấu trúc **3 lớp**:

```
┌─────────────────────────────────────────────────────────┐
│         ☁️  Lớp ứng dụng (Cloud & App Layer)            │
│   OhStem Dashboard · Biểu đồ lịch sử · Điều khiển xa   │
└──────────────────────────┬──────────────────────────────┘
                           │ MQTT (WiFi)
┌──────────────────────────▼──────────────────────────────┐
│          🖥️  Lớp trung gian (Gateway Layer)              │
│   Script Python · Xử lý AI (Inference) · Serial → MQTT  │
└──────────────────────────┬──────────────────────────────┘
                           │ Serial (USB)
┌──────────────────────────▼──────────────────────────────┐
│            📡  Lớp thiết bị (Edge Layer)                 │
│   Yolo:Bit · Cảm biến · Động cơ · Đèn · Servo           │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Cấu hình kênh thông tin (MQTT Topics)

Để hệ thống vận hành đồng bộ, các kênh dữ liệu được phân bổ như sau:

| Kênh | Loại | Mô tả |
|------|------|-------|
| `V1` | Cảm biến | Nhiệt độ |
| `V2` | Cảm biến | Độ ẩm |
| `V3` | Cảm biến | Ánh sáng |
| `V10` | Điều khiển | Đèn |
| `V11` | Điều khiển | Quạt |
| `V12` | Điều khiển | Servo (khóa cửa) |
| `V13` | Phản hồi | Kênh phản hồi của Trợ lý ảo |
| `V14` | AI | Kết quả nhận diện FaceAI |

---

## 6. Hướng dẫn cài đặt nhanh

1. **Phần cứng:** Kết nối các thiết bị vào mạch mở rộng theo đúng sơ đồ Pinout:
   - `P0`: LED | `P1`: IR Remote | `P2`: Cảm biến ánh sáng
   - `P3`: PIR | `P4`: Servo | `I2C`: LCD 1602 & DHT20

2. **Firmware:** Nạp chương trình khung AIoT vào Yolo:Bit thông qua trang [app.ohstem.vn](https://app.ohstem.vn).

3. **Gateway:** Chạy script `gateway.py` trên máy tính để kết nối cổng USB và đăng nhập MQTT Broker:
   ```bash
   python gateway.py
   ```

4. **AI:** Huấn luyện mô hình tại mục **"Mô hình AI"** và liên kết với Username hệ thống.

---

## 7. Đội ngũ thực hiện

| Vai trò | Trách nhiệm |
|---------|-------------|
| 🔧 **Hardware Lead** | Kết nối mạch, sensor và logic nhúng. |
| 🤖 **AI & Gateway Expert** | Script Python, xử lý Serial và huấn luyện mô hình ML. |
| ☁️ **Backend Developer** | Quản trị Cloud Server, MQTT và thiết kế Database. |
| 🎨 **Frontend Developer** | Thiết kế Dashboard UI/UX và ứng dụng giám sát. |

---

<div align="center">
  <sub>© 2024 Yolo:Home Project – Powered by OhStem & ESP32</sub>
</div>
