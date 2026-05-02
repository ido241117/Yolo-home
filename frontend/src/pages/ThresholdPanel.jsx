import { useState } from "react";

const DEFAULTS = {
  fan:   { thresh: 30 },
  light: { thresh: 200 },
};

function ThresholdCard({
  icon, iconClass, title, subtitle, ucBadge,
  useAI, onToggleAI,
  thresh, onChangeThresh,
  sliderMin, sliderMax, sliderDefault,
  sliderLabel, sliderMinLabel, sliderMaxLabel, unit,
  currentValue, currentUnit,
  deviceOn,
  statusText, statusColor,
  logicRows,
}) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className={`device-icon ${iconClass}`} style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{title}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{subtitle}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: statusColor, fontWeight: 500 }}>● {statusText}</span>
          <span className="badge badge-blue" style={{ fontSize: 10 }}>{ucBadge}</span>
        </div>
      </div>

      {/* AI toggle row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderRadius: 8,
        background: useAI ? "rgba(37,99,235,0.06)" : "#f9fafb",
        border: `1px solid ${useAI ? "rgba(37,99,235,0.2)" : "#e5e7eb"}`,
        marginBottom: 20,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
            {useAI ? "AI tự động quyết định ngưỡng" : "Người dùng đặt ngưỡng thủ công"}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
            {useAI
              ? "Slider bị khoá — AI mock đang dùng ngưỡng mặc định"
              : "Kéo slider để chỉnh ngưỡng kích hoạt"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Thủ công</span>
          <button
            className={`toggle ${useAI ? "toggle-on" : "toggle-off"}`}
            onClick={onToggleAI}
            style={{ background: useAI ? "#2563eb" : "#d1d5db" }}
          />
          <span style={{ fontSize: 11, color: useAI ? "#2563eb" : "#9ca3af", fontWeight: useAI ? 600 : 400 }}>AI</span>
        </div>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 20, opacity: useAI ? 0.4 : 1, transition: "opacity 0.2s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "#374151" }}>{sliderLabel}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
            {thresh}<span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 2 }}>{unit}</span>
          </span>
        </div>
        <input
          type="range"
          min={sliderMin} max={sliderMax}
          value={thresh}
          disabled={useAI}
          onChange={(e) => onChangeThresh(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#2563eb", cursor: useAI ? "not-allowed" : "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
          <span>{sliderMinLabel}</span>
          <span>{sliderDefault}{unit} (mặc định)</span>
          <span>{sliderMaxLabel}</span>
        </div>
      </div>

      {/* Current sensor info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "#9ca3af" }}>Giá trị hiện tại</span>
          <span style={{ fontWeight: 500, color: "#111827" }}>
            {currentValue != null ? `${currentValue} ${currentUnit}` : "--"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "#9ca3af" }}>Trạng thái thiết bị</span>
          <span style={{ fontWeight: 500, color: deviceOn ? "#16a34a" : "#6b7280" }}>
            {deviceOn ? "● Đang bật" : "Đang tắt"}
            {!useAI && " (thủ công)"}
          </span>
        </div>
      </div>

      {/* Logic block */}
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.07em", marginBottom: 10 }}>
          LOGIC TỰ ĐỘNG
        </div>
        {logicRows.map((row) => (
          <div key={row.condition} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: "#374151" }} dangerouslySetInnerHTML={{ __html: row.condition }} />
            <span style={{ fontWeight: 600, color: row.color }}>{row.result}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ThresholdPanel() {
  const [fanAI,   setFanAI]   = useState(false);
  const [lightAI, setLightAI] = useState(false);

  const [fanThresh,   setFanThresh]   = useState(DEFAULTS.fan.thresh);
  const [lightThresh, setLightThresh] = useState(DEFAULTS.light.thresh);

  const [dirty,  setDirty]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // HARDCODE — thay bằng polling từ /api/feeds khi có feed thật
  const currentTemp   = null;  // getFeed("temperature")?.last_value
  const currentLight  = null;  // getFeed("signal")?.last_value
  const fanDeviceOn   = false; // getFeed("fan-switch")?.last_value === "ON"
  const lightDeviceOn = false; // getFeed("led-switch")?.last_value === "ON"

  const markDirty = (fn) => { fn(); setDirty(true); setSaved(false); };

  const handleSave = async () => {
    setSaving(true);
    // Khi có feed threshold-fan / threshold-light: gọi sendFeedData ở đây
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    setDirty(false);
    setSaved(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Ngưỡng tự động</h2>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            Điều chỉnh ngưỡng kích hoạt cho từng thiết bị — áp dụng ngay sau khi lưu
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saved && !dirty && (
            <span style={{ fontSize: 12, color: "#16a34a" }}>✓ Đã lưu</span>
          )}
          {dirty && (
            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, background: "rgba(251,191,36,0.15)", color: "#d97706", fontWeight: 500, border: "1px solid rgba(251,191,36,0.3)" }}>
              Chưa lưu thay đổi
            </span>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={!dirty || saving}>
            {saving ? "Đang lưu..." : "Lưu ngưỡng"}
          </button>
        </div>
      </div>

      <ThresholdCard
        icon="⚡" iconClass="device-icon-green"
        title="Quạt mini — ngưỡng nhiệt độ"
        subtitle="UC04 · Cảm biến DHT20"
        ucBadge="UC04"
        useAI={fanAI}
        onToggleAI={() => { setFanAI((v) => !v); setDirty(true); setSaved(false); }}
        thresh={fanThresh}
        onChangeThresh={(v) => markDirty(() => setFanThresh(v))}
        sliderMin={20} sliderMax={40} sliderDefault={30}
        sliderLabel="Bật quạt khi nhiệt độ vượt"
        sliderMinLabel="20°C (mát)" sliderMaxLabel="40°C (nóng)"
        unit="°C"
        currentValue={currentTemp} currentUnit="°C"
        deviceOn={fanDeviceOn}
        statusText={fanDeviceOn ? `Đang bật — ${currentTemp ?? "--"}°C > ngưỡng` : `Đang tắt — ${currentTemp ?? "--"}°C`}
        statusColor={fanDeviceOn ? "#16a34a" : "#f59e0b"}
        logicRows={[
          { condition: `Nhiệt độ &gt; <strong>${fanThresh}°C</strong>`, result: "Bật quạt", color: "#16a34a" },
          { condition: `Nhiệt độ ≤ <strong>${fanThresh}°C</strong>`, result: "Tắt quạt", color: "#6b7280" },
        ]}
      />

      <ThresholdCard
        icon="☀" iconClass="device-icon-blue"
        title="Đèn LED trắng — ngưỡng ánh sáng"
        subtitle="UC03 · Cảm biến quang"
        ucBadge="UC03"
        useAI={lightAI}
        onToggleAI={() => { setLightAI((v) => !v); setDirty(true); setSaved(false); }}
        thresh={lightThresh}
        onChangeThresh={(v) => markDirty(() => setLightThresh(v))}
        sliderMin={50} sliderMax={500} sliderDefault={200}
        sliderLabel="Bật đèn khi ánh sáng xuống dưới"
        sliderMinLabel="50 lux (tối)" sliderMaxLabel="500 lux (sáng)"
        unit=" lux"
        currentValue={currentLight} currentUnit="lux"
        deviceOn={lightDeviceOn}
        statusText={lightDeviceOn ? `Đang bật — ${currentLight ?? "--"} lux < ngưỡng` : `Đang tắt — ${currentLight ?? "--"} lux`}
        statusColor={lightDeviceOn ? "#16a34a" : "#60a5fa"}
        logicRows={[
          { condition: `Ánh sáng &lt; <strong>${lightThresh} lux</strong>`, result: "Bật đèn", color: "#16a34a" },
          { condition: `Ánh sáng ≥ <strong>${lightThresh} lux</strong>`, result: "Tắt đèn", color: "#6b7280" },
        ]}
      />
    </div>
  );
}
