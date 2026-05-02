import { useState } from "react";
import { runFaceRecognition, runVoiceRecognition } from "../services/api";

function ResultCard({ result }) {
  if (!result) return null;
  return (
    <div className={`ai-result ${result.success ? "success" : "fail"}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, color: result.success ? "#16a34a" : "#dc2626" }}>
          {result.success ? "✓ Thành công" : "✗ Thất bại"}
        </span>
        <span className={`badge ${result.success ? "badge-green" : "badge-red"}`}>
          {result.action}
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>{result.message}</div>
      {result.command && (
        <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
          Lệnh: <strong style={{ color: "#111827" }}>{result.command}</strong>
        </div>
      )}
      {result.identity && (
        <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
          Danh tính: <strong style={{ color: "#111827" }}>{result.identity}</strong>
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
          <span>Độ tin cậy</span>
          <span>{(result.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{
              width: `${result.confidence * 100}%`,
              background: result.success ? "#22c55e" : "#ef4444",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AIPanel() {
  const [faceResult, setFaceResult] = useState(null);
  const [voiceResult, setVoiceResult] = useState(null);
  const [loadingFace, setLoadingFace] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [error, setError] = useState(null);

  const handleFace = async () => {
    setLoadingFace(true);
    setError(null);
    try {
      const res = await runFaceRecognition();
      setFaceResult(res.data);
    } catch {
      setError("Lỗi gọi face recognition. Kiểm tra backend Flask.");
    } finally {
      setLoadingFace(false);
    }
  };

  const handleVoice = async () => {
    setLoadingVoice(true);
    setError(null);
    try {
      const res = await runVoiceRecognition();
      setVoiceResult(res.data);
    } catch {
      setError("Lỗi gọi voice recognition. Kiểm tra backend Flask.");
    } finally {
      setLoadingVoice(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Nhận diện AI</h2>
      </div>

      <div style={{ marginBottom: 16, fontSize: 12, color: "#9ca3af" }}>
        Mock module: 90% thành công, 10% thất bại (random). Sẽ được thay bằng model thật của team AI.
      </div>

      {error && (
        <div style={{
          marginBottom: 14, padding: "8px 12px", borderRadius: 8,
          background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
          fontSize: 12, color: "#dc2626",
        }}>
          {error}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3>Khuôn mặt (UC06)</h3>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>
            Giả lập nhận diện khuôn mặt để mở khóa cửa.
          </p>
          <button className="btn btn-primary" onClick={handleFace} disabled={loadingFace}>
            {loadingFace ? "Đang nhận diện..." : "Nhận diện khuôn mặt"}
          </button>
          <ResultCard result={faceResult} />
        </div>

        <div className="card">
          <h3>Giọng nói (UC07)</h3>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>
            Giả lập nhận diện giọng nói để thực thi lệnh.
          </p>
          <button className="btn btn-primary" onClick={handleVoice} disabled={loadingVoice}>
            {loadingVoice ? "Đang nhận diện..." : "Nhận diện giọng nói"}
          </button>
          <ResultCard result={voiceResult} />
        </div>
      </div>
    </div>
  );
}
