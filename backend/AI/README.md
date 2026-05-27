# DADN Python AI

Internal AI service for the NestJS backend.

## Run

```powershell
cd "D:\Project C\DADN\backend\AI"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Default URL:

```text
http://localhost:8001/ai
```

Endpoints used by NestJS:

```text
GET  /ai/health
POST /ai/auto-control/predict
POST /ai/face/recognize
```

The copied DecisionTree models are expected in `models/`:

```text
fan_model.pkl
features.pkl
light_model.pkl
light_features.pkl
```
