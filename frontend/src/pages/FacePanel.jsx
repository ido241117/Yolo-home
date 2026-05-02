import { useState, useEffect, useCallback } from "react";
import { getFaceLog } from "../services/api";

const MOCK_FACES = [
  { id: 1, initials: "TN", name: "Thiên Nguyễn", color: "#2563eb", date: "01/04/2026", samples: 5, accuracy: 96, owner: true },
  { id: 2, initials: "AN", name: "An Nguyễn",    color: "#16a34a", date: "03/04/2026", samples: 3, accuracy: 91, owner: false },
  { id: 3, initials: "BT", name: "Bảo Trần",     color: "#d97706", date: "05/04/2026", samples: 2, accuracy: 87, owner: false },
];

function FaceCard({ face, onDelete }) {
  const needMore = face.accuracy < 90;
  return (
    <div style={{
      border: `1.5px solid ${face.owner ? "rgba(37,99,235,0.3)" : "#e5e7eb"}`,
      borderRadius: 12, padding: "20px 18px", position: "relative",
      background: face.owner ? "rgba(37,99,235,0.03)" : "#fff",
    }}>
      {face.owner && (
        <span style={{
          position: "absolute", top: 12, right: 12,
          fontSize: 10, padding: "2px 8px", borderRadius: 99,
          background: "rgba(37,99,235,0.1)", color: "#2563eb", fontWeight: 600,
        }}>Chủ nhà</span>
      )}
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: `rgba(${face.color === "#2563eb" ? "37,99,235" : face.color === "#16a34a" ? "22,163,74" : "217,119,6"},0.12)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, fontWeight: 700, color: face.color, margin: "0 auto 12px",
      }}>{face.initials}</div>

      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{face.name}</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
          Đăng ký {face.date} · {face.samples} mẫu
        </div>
        <div style={{
          fontSize: 12, fontWeight: 600, marginTop: 6,
          color: needMore ? "#d97706" : "#16a34a",
        }}>
          Độ chính xác: {face.accuracy}%{needMore ? " — cần thêm mẫu" : ""}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {needMore ? (
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 14px" }}>Thêm mẫu</button>
        ) : (
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 14px" }}>Cập nhật</button>
        )}
        <button className="btn btn-ghost"
          style={{ fontSize: 12, padding: "5px 14px", color: "#dc2626", borderColor: "rgba(239,68,68,0.3)" }}
          onClick={() => onDelete(face.id)}>
          Xóa
        </button>
      </div>
    </div>
  );
}

function AddCard({ onClick }) {
  return (
    <div onClick={onClick} style={{
      border: "1.5px dashed #d1d5db", borderRadius: 12, padding: "20px 18px",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 8, cursor: "pointer", minHeight: 180, background: "#fafafa",
      transition: "border-color 0.15s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#2563eb"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "#d1d5db"}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #d1d5db",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#9ca3af",
      }}>+</div>
      <div style={{ fontSize: 12, color: "#6b7280" }}>Đăng ký khuôn mặt mới</div>
    </div>
  );
}

const LOG_COLORS = { OPEN: "#16a34a", DENIED: "#dc2626" };
const LOG_LABELS = { OPEN: "Mở cửa", DENIED: "Từ chối" };

export default function FacePanel() {
  const [faces, setFaces]   = useState(MOCK_FACES);
  const [log,   setLog]     = useState([]);

  const fetchLog = useCallback(async () => {
    try { const r = await getFaceLog(); setLog(r.data); } catch { }
  }, []);

  useEffect(() => {
    fetchLog();
    const iv = setInterval(fetchLog, 5000);
    return () => clearInterval(iv);
  }, [fetchLog]);

  const handleDelete = (id) => setFaces((f) => f.filter((x) => x.id !== id));

  // Mock data for display when log is empty
  const displayLog = log.length > 0 ? log : [
    { time: "14:28:03", face: "Thiên Nguyễn", result: "OPEN",   confidence: 96 },
    { time: "14:10:33", face: "Người lạ",     result: "DENIED", confidence: 34 },
    { time: "13:55:10", face: "An Nguyễn",    result: "OPEN",   confidence: 93 },
    { time: "13:40:02", face: "Người lạ",     result: "DENIED", confidence: 41 },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Quản lý khuôn mặt</h2>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            UC06 · UC08 — Quản lý danh sách khuôn mặt · Đăng ký mẫu mới thực hiện trên ứng dụng điện thoại
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 500 }}>● Camera sẵn sàng</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>·</span>
          <span style={{ fontSize: 12, color: "#374151" }}>{faces.length} khuôn mặt đã đăng ký</span>
        </div>
      </div>

      {/* Face grid */}
      <div style={{ marginBottom: 8 }}>
        <div className="devices-section-label">KHUÔN MẶT ĐÃ ĐĂNG KÝ</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          {faces.map((f) => <FaceCard key={f.id} face={f} onDelete={handleDelete} />)}
          <AddCard onClick={() => {}} />
        </div>
      </div>

      {/* Bottom: Register instruction + Log */}
      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Register via mobile */}
        <div>
          <div className="devices-section-label">ĐĂNG KÝ KHUÔN MẶT MỚI</div>
          <div className="card">
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "24px 0", gap: 12,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
              }}>📱</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
                  Dùng ứng dụng điện thoại
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>
                  Quy trình chụp mẫu khuôn mặt yêu cầu camera điện thoại.<br />
                  Mở <span style={{ fontFamily: "monospace", color: "#2563eb" }}>nhan_dien_khuon_mat.mobile</span> trên điện thoại để đăng ký.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {["nhìn thẳng", "quay trái", "quay phải", "ngẩng lên", "cúi xuống"].map((p) => (
                  <span key={p} style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 99,
                    background: "#f0f2f5", color: "#374151",
                  }}>{p}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Config */}
          <div className="devices-section-label" style={{ marginTop: 16 }}>CẤU HÌNH NHẬN DIỆN</div>
          <div className="card">
            {[
              { label: "Ngưỡng chấp nhận",    value: "≥ 85%", color: "#111827" },
              { label: "Phản hồi khi từ chối", value: "Kích buzzer 3 lần", color: "#111827" },
              { label: "Thời gian timeout",    value: "10 giây", color: "#111827" },
              { label: "Model AI",             value: "Google Teachable Machine", color: "#2563eb" },
            ].map((r) => (
              <div key={r.label} style={{
                display: "flex", justifyContent: "space-between", fontSize: 13,
                padding: "8px 0", borderBottom: "1px solid #f3f4f6",
              }}>
                <span style={{ color: "#9ca3af" }}>{r.label}</span>
                <span style={{ fontWeight: 500, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Log */}
        <div>
          <div className="devices-section-label">LOG NHẬN DIỆN HÔM NAY</div>
          <div className="card">
            <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 70px 80px", gap: 8, marginBottom: 10 }}>
              {["GIỜ", "KHUÔN MẶT", "KẾT QUẢ", "ĐỘ TIN CẬY"].map((h) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.06em" }}>
                  {h}
                </div>
              ))}
            </div>
            {displayLog.map((entry, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "70px 1fr 70px 80px",
                gap: 8, alignItems: "center", padding: "8px 0",
                borderTop: "1px solid #f3f4f6", fontSize: 13,
              }}>
                <span style={{ color: "#9ca3af", fontFamily: "monospace", fontSize: 12 }}>{entry.time}</span>
                <span style={{ fontWeight: 500, color: "#111827" }}>{entry.face}</span>
                <span style={{ fontWeight: 600, color: LOG_COLORS[entry.result] ?? "#6b7280" }}>
                  {LOG_LABELS[entry.result] ?? entry.result}
                </span>
                <span style={{
                  fontWeight: 600,
                  color: entry.result === "DENIED" ? "#dc2626" : "#111827",
                }}>
                  {entry.confidence}%
                  {entry.result === "DENIED" && (
                    <span style={{ fontSize: 10, color: "#dc2626" }}> — dưới ngưỡng</span>
                  )}
                </span>
              </div>
            ))}
            {log.length === 0 && (
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
                (Dữ liệu mẫu — log thật từ app mobile gửi POST /security/face/log)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
