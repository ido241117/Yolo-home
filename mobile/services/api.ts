const BASE_URL = 'http://192.168.1.116:5000/api'; // IP WiFi của PC — cùng mạng với điện thoại

export type FaceResult = {
  success: boolean;
  confidence: number;
  identity: string;
  action: 'UNLOCK' | 'DENY';
  message: string;
};

export type VoiceResult = {
  success: boolean;
  confidence: number;
  command: string | null;
  action: 'EXECUTE' | 'DENY';
  message: string;
};

export async function recognizeFace(imageBase64?: string): Promise<FaceResult> {
  const res = await fetch(`${BASE_URL}/ai/face-recognition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 ?? null }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function recognizeVoice(audioBase64?: string): Promise<VoiceResult> {
  const res = await fetch(`${BASE_URL}/ai/voice-recognition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio: audioBase64 ?? null }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
