# 🚀 Adaptive License Validation System - Quick Demo

## Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or Atlas)

## Quick Start (2 minutes)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Configure .env with MongoDB URI
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 3. Demo Script (Optional)
```bash
python demo_script.py
```

## 🎬 Demo Flow (15 minutes)

### Phase 1: Normal Operation (3 min)
1. **License Activation**: Generate and activate license
2. **Normal Behavior**: Click buttons at normal pace
3. **Observe**: Trust score stays high (90-100), policy = ALLOW

### Phase 2: Anomaly Detection (5 min)
1. **Rapid Clicking**: Click buttons quickly (spam)
2. **ML Detection**: System detects anomaly
3. **Policy Escalation**: Trust score drops, policy changes to WARN → RESTRICT → SUSPEND

### Phase 3: Admin Recovery (3 min)
1. **Admin Panel**: Use admin dashboard to reset trust score
2. **Gradual Recovery**: Trust score rebuilds over time
3. **Normal Access**: System returns to ALLOW policy

### Phase 4: System Health (4 min)
1. **Health Dashboard**: Shows component status
2. **Demo Mode**: Toggle for faster responses
3. **Architecture View**: Visual system breakdown

## 🎯 Key Features to Highlight

- ✅ **Continuous Monitoring**: Real-time behavior tracking
- ✅ **ML Anomaly Detection**: Isolation Forest algorithm
- ✅ **Dynamic Trust Scoring**: Penalty-based risk assessment
- ✅ **Adaptive Policies**: ALLOW/WARN/RESTRICT/SUSPEND
- ✅ **Device Binding**: Hardware-locked validation
- ✅ **Visual Transparency**: Real-time status indicators

## 🔧 Demo Controls

- **Demo Mode Toggle**: Speeds up responses for presentations
- **System Health**: Real-time component status
- **Behavior Timeline**: Visual activity history
- **Trust Score Breakdown**: Shows calculation factors

## 📊 Expected Results

- **Normal Behavior**: Trust Score 90-100, Policy: ALLOW
- **Anomaly Trigger**: Trust Score drops by 30, Policy: WARN
- **Escalation**: Trust Score <50, Policy: RESTRICT/SUSPEND
- **Recovery**: Admin reset restores normal operation

## 🆘 Troubleshooting

- **MongoDB Issues**: Check .env configuration
- **Port Conflicts**: Ensure 3000/8000 are free
- **ML Model**: Verify ml_model/model.pkl exists
- **Demo Mode**: Toggle in dashboard for faster demos

---

**Demo Time**: 15-20 minutes
**Technical Level**: Intermediate
**Audience**: Stakeholders, security teams, product managers