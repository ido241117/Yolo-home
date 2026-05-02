# Adafruit Dashboard Integration

## 🔑 Credentials & Access

### Primary Account (thienphan2411)
- **Username:** `thienphan2411`
- **Active Key:** `<ADAFRUIT_API_KEY>`
- **Dashboard:** `abc` (test dashboard, toggle button only)

### Secondary Account (Bong_Bong) - Team Dashboard
- **Username:** `Bong_Bong`
- **Dashboard Name:** `YoloHome`
- **Dashboard Key:** `nothing`
- **Accessibility:** Public (shared with team via same API key)

---

## 📊 Project Dashboard Structure (YoloHome)

### Active Feeds & Blocks

| # | Block Type | Feed Name | Feed Key | Purpose | Value Type |
|---|-----------|-----------|----------|---------|-----------|
| 1 | Toggle Button | Fan switch | `fan-switch` | Control fan on/off | Boolean (ON/OFF) |
| 2 | Line Chart | Temperature | `temperature` | Display temperature trends | Numeric |
| 3 | Gauge | Humidity | `gauge` | Display humidity (block name = "Humidity", feed key = "gauge") | Numeric (0-100) |
| 4 | Indicator | Signal | `signal` | Show signal status | String/Boolean |
| 5 | Stream | Logs | `logs` | Display system logs | String |
| 6 | Remote Control | Remote | `remote` | Remote control buttons | Command |
| 7 | Slider | Fan speed | `fan-speed` | Adjust fan speed | Numeric (0-100) |

---

## 🔗 API Endpoints

### Base URL
```
https://io.adafruit.com/api/v2/{username}
```

### Dashboards
```
GET /dashboards                          # List all dashboards
GET /dashboards/{dashboard-key}/blocks   # Get blocks in dashboard
```

### Feeds
```
GET /feeds                               # List all feeds
GET /feeds/{feed-key}                    # Get specific feed
GET /feeds/{feed-key}/data               # Get feed data/history
POST /feeds/{feed-key}/data              # Send data to feed
```

### Headers Required
```
X-AIO-Key: <ADAFRUIT_API_KEY>
```

---

## 💻 Integration Status

### Current Setup
- ✅ API credentials configured
- ✅ Dashboard structure mapped
- ✅ Access verified (can read Bong_Bong's public dashboard)

### To Be Implemented
- [ ] Web interface for dashboard display (HTML/CSS/JS)
- [ ] Real-time data fetching from feeds
- [ ] Control buttons for toggle and slider
- [ ] Temperature chart visualization
- [ ] Log stream display
- [ ] Remote control interface

---

## 🚀 How to Use Credentials

### In JavaScript/HTML
```javascript
const ADAFRUIT_USERNAME = "Bong_Bong";
const ADAFRUIT_API_KEY = "<ADAFRUIT_API_KEY>";
const DASHBOARD_KEY = "nothing";

// Fetch dashboard blocks
const response = await fetch(
  `https://io.adafruit.com/api/v2/${ADAFRUIT_USERNAME}/dashboards/${DASHBOARD_KEY}/blocks`,
  {
    headers: { "X-AIO-Key": ADAFRUIT_API_KEY }
  }
);
```

### In Shell/PowerShell
```powershell
$headers = @{"X-AIO-Key" = "<ADAFRUIT_API_KEY>"}
$uri = "https://io.adafruit.com/api/v2/Bong_Bong/dashboards/nothing/blocks"

$response = Invoke-RestMethod -Uri $uri -Headers $headers
```

---

## 📝 Notes

- **API Key Scope:** Full read/write access to dashboard
- **Rate Limit:** Check Adafruit IO API documentation for limits
- **Project Phase:** Demo/Development (not production)
- **Team Access:** All team members using same API key can access this dashboard

---

## 🔄 Related Documentation

- **Project Root:** `d:\Project C\Yolohome0205\`
- **Main HTML:** `Yolo-home\index.html`
- **Backend:** `d:\Project C\backend\`

---

---

## ⚠️ Missing Feeds — Pending from Firmware Team

Các feed sau **chưa có trên Adafruit dashboard** của Bong_Bong (tính đến 2026-05-02).
Webapp hiện dùng **hardcode tạm** — khi firmware team tạo feed xong thì thay theo hướng dẫn từng mục bên dưới.

---

### Nhóm 1 — Trang Dashboard (`/`)

| Thiết bị | Feed Key cần tạo | Value Type | Hiện tại |
|----------|-----------------|------------|----------|
| Đèn LED trắng | `led-switch` | `ON`/`OFF` | Hardcode `on=false` |
| Relay | `relay-switch` | `ON`/`OFF` | Hardcode `on=true` |

**Vị trí hardcode:** `Yolo-home/frontend/src/pages/Dashboard.jsx`

Tìm phần `{/* Device status */}`, thay 2 `DeviceCard` cứng:
```jsx
// HARDCODE TẠM — thay khi có feed
<DeviceCard name="Đèn LED trắng" on={light != null && light < 300} ... />  // ← logic tạm
<DeviceCard name="Relay"         on={true} ... />                           // ← hardcode
```
Khi có feed: đọc `getFeed("led-switch")?.last_value === "ON"` và `getFeed("relay-switch")?.last_value === "ON"`.

---

### Nhóm 2 — Trang Điều khiển (`/control`)

| Feed | Feed Key cần tạo | Value Type | Hiện tại |
|------|-----------------|------------|----------|
| Đèn LED toggle | `led-switch` | `ON`/`OFF` | Hardcode local state `ledOn=true` |
| Relay toggle | `relay-switch` | `ON`/`OFF` | Hardcode local state `relayOn=true` |
| Tốc độ quạt | `fan-speed` | Numeric `0–100` | **Đã có feed** nhưng slider bị bỏ khi redesign — cần thêm lại |

**Vị trí hardcode:** `Yolo-home/frontend/src/pages/ControlPanel.jsx`

```jsx
// HARDCODE TẠM — thay khi có feed
const [ledOn,   setLedOn]   = useState(true);   // ← thay bằng getFeed("led-switch")
const [relayOn, setRelayOn] = useState(true);   // ← thay bằng getFeed("relay-switch")

const handleLed   = () => { ... }  // ← bỏ comment, gọi send("led-switch", ...)
const handleRelay = () => { ... }  // ← bỏ comment, gọi send("relay-switch", ...)
```

Thông tin sensor trong `DeviceInfoCard` (nhiệt độ hiện tại, ánh sáng hiện tại) cũng đang hardcode `"-- lux"` / `"-- °C"` — khi có feed thật từ polling, truyền giá trị từ `/api/feeds` vào.

---

### Nhóm 3 — Trang Ngưỡng tự động (`/thresholds`)

Trang này dùng mock AI (`backend/ai/auto_control.py`) với ngưỡng cứng trong code Python. Hiện **chưa có feed nào** lưu ngưỡng lên Adafruit — ngưỡng chỉ tồn tại trong session React.

| Tính năng | Feed Key nên tạo | Value Type | Hiện tại |
|-----------|-----------------|------------|----------|
| Ngưỡng bật quạt | `threshold-fan` | Numeric `°C` | Hardcode `30` trong React state |
| Ngưỡng bật đèn | `threshold-light` | Numeric `lux` | Hardcode `200` trong React state |

**Vị trí hardcode:** `Yolo-home/frontend/src/pages/ThresholdPanel.jsx` (chưa tạo)

Khi có feed: đọc giá trị ngưỡng từ feed khi load trang, ghi lại khi user nhấn Lưu.

**Backend `auto_control.py`:** ngưỡng hiện hardcode trong file Python:
```python
# Yolo-home/backend/ai/auto_control.py
FAN_ON_THRESHOLD  = 30   # ← thay bằng đọc từ feed threshold-fan khi có
FAN_OFF_THRESHOLD = 27
LIGHT_ON_THRESHOLD  = 300  # ← thay bằng đọc từ feed threshold-light khi có
LIGHT_OFF_THRESHOLD = 500
```

---

### Nhóm 4 — Trang Mật mã (`/pin`) — UC05

**Luồng demo:**
1. User nhập mật mã trên numpad webapp (PC) hoặc nhấn phím remote IR
2. Frontend gửi POST lên Flask backend để xác thực
3. Backend so sánh với mật mã lưu trong bộ nhớ server, xử lý logic đếm sai / khóa tạm 5 phút
4. Backend ghi kết quả lên 2 feed Adafruit bên dưới
5. ESP32 đọc feed `lock-status` → điều khiển khóa cửa vật lý

**Feed Adafruit cần tạo (chỉ 2):**

| Feed | Feed Key cần tạo | Value Type | Chiều | Mục đích |
|------|-----------------|------------|-------|----------|
| Trạng thái khóa | `lock-status` | `LOCKED`/`UNLOCKED` | Backend → Ada → ESP32 | ESP32 đọc để điều khiển khóa |
| Số lần sai | `pin-fail-count` | Numeric `0–3` | Backend → Ada | Webapp đọc để hiển thị cảnh báo |

**Không cần feed:** `pin-log` (lưu trong backend), `pin-change` (mật mã lưu trong backend, không qua Adafruit).

**Vị trí hardcode:** `Yolo-home/frontend/src/pages/PinPanel.jsx` (chưa tạo) — numpad, trạng thái khóa, lịch sử nhập đều đang hardcode tĩnh trong mockup.

---

### Nhóm 5 — Trang Khuôn mặt (`/face`) — UC06, UC08

**Luồng demo:**
1. Train model 1 lần bằng **Google Teachable Machine** (kéo thả ảnh khuôn mặt chủ nhà)
2. Xuất model, chạy trên **giao diện mobile** khi demo
3. Mobile nhận diện → ghi kết quả (`OPEN`/`DENIED`) lên feed Adafruit
4. ESP32 đọc feed → điều khiển khóa cửa
5. Webapp PC chỉ đọc feed để hiển thị log

**Feed Adafruit cần tạo (chỉ 1):**

| Feed | Feed Key cần tạo | Value Type | Chiều | Mục đích |
|------|-----------------|------------|-------|----------|
| Kết quả nhận diện | `face-result` | `OPEN`/`DENIED` | Mobile → Ada → ESP32 | ESP32 đọc để mở khóa; webapp đọc để hiển thị log |

**Không cần feed:** camera status, danh sách khuôn mặt — tất cả quản lý trực tiếp trên Teachable Machine và app mobile.

**Vị trí hardcode:** `Yolo-home/frontend/src/pages/AIPanel.jsx` — kết quả nhận diện hiện là mock 90% random, log hardcode tĩnh. Khi có feed thật: đọc `face-result` từ Adafruit để hiển thị log thay vì random.

---

### Nhóm 6 — Trang Giọng nói (`/voice`) — UC07

**Luồng demo:**
1. Train model 1 lần bằng **Google Teachable Machine** (thu âm lệnh "Mở cửa" / "Đóng cửa")
2. Xuất model, chạy trên **giao diện mobile** khi demo
3. Mobile nhận diện lệnh → ghi kết quả lên feed Adafruit
4. ESP32 đọc feed → thực thi lệnh
5. Webapp PC chỉ đọc feed để hiển thị log

**Feed Adafruit cần tạo (chỉ 1):**

| Feed | Feed Key cần tạo | Value Type | Chiều | Mục đích |
|------|-----------------|------------|-------|----------|
| Kết quả nhận diện | `voice-result` | `OPEN`/`CLOSE`/`DENIED` | Mobile → Ada → ESP32 | ESP32 đọc để thực thi; webapp đọc để hiển thị log |

**Không cần feed:** mic status, phone status — chỉ là UI trang trí trong mockup, không có giá trị tương tác thực.

**Vị trí hardcode:** `Yolo-home/frontend/src/pages/AIPanel.jsx` — hiện dùng chung trang với khuôn mặt (mock 90% random). Khi có feed thật: đọc `voice-result` từ Adafruit để hiển thị log.

---

### Backend — không cần sửa khi feed mới được thêm

`get_feeds_from_blocks()` trong `utils/adafruit.py` tự động pick up feed mới từ dashboard blocks — không cần sửa code backend khi firmware team thêm block mới lên Adafruit.

POST `/feeds/<feed_key>/data` trong `routes/feeds.py` hoạt động với bất kỳ feed key nào — chỉ cần Bong_Bong mở write permission.

---

**Last Updated:** 2026-05-02
**Maintained By:** Agent Documentation System
