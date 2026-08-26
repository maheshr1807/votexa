# 🗳️ VoteSecure — Hybrid Smart Voting System

A full-stack, production-grade hybrid voting system with AI face recognition and biometric authentication.

## 🔑 Security Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Password | bcrypt (salt 12) | Secure password hashing |
| Auth | JWT (7-day expiry) | Session management |
| Data Encryption | AES-256 (crypto-js) | Encrypt face embeddings |
| Vote Integrity | SHA-256 | Tamper-proof vote hashes |
| Face Recognition | face-api.js (TensorFlow.js) | Client-side face matching |
| Biometric | WebAuthn/FIDO2 | Device fingerprint/Face ID |
| Transport | HTTPS (TLS) | Secure communication |

## 📁 Project Structure

```
online voting/
├── client/                     # React + Vite frontend
│   ├── public/
│   │   └── models/             # ← face-api.js model files go here
│   └── src/
│       ├── api/axios.js        # Axios with JWT interceptor
│       ├── context/AuthContext.jsx
│       ├── utils/
│       │   ├── faceRecognition.js  # face-api.js helpers
│       │   └── webAuthn.js         # WebAuthn helpers
│       └── pages/
│           ├── Home.jsx
│           ├── PublicResults.jsx
│           ├── voter/           # Register, Login, FaceVerify, Vote...
│           ├── admin/           # Dashboard, Candidates, Elections...
│           └── officer/         # Login, Search, CastVote...
│
└── server/                     # Node.js + Express backend
    ├── config/
    │   ├── db.js               # MongoDB connection
    │   └── encryption.js       # AES-256 + SHA-256
    ├── middleware/
    │   ├── auth.js             # JWT protect + restrictTo
    │   ├── upload.js           # Multer file upload
    │   └── voteIntegrity.js    # SHA-256 hash generation
    ├── models/                 # Mongoose schemas
    ├── controllers/            # Business logic
    ├── routes/                 # Express routes
    └── seeders/seed.js         # Database seeder
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Modern browser with WebAuthn support (for biometric)

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hybrid_voting
JWT_SECRET=your_super_secret_key_here
AES_SECRET=your_aes_256_secret_32chars!!
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:5173
```

### 3. Download face-api.js Models

Download the following model files and place them in `client/public/models/`:

- `ssd_mobilenetv1_model-weights_manifest.json` + shard files
- `face_landmark_68_model-weights_manifest.json` + shard files  
- `face_recognition_model-weights_manifest.json` + shard files

**Download from:** https://github.com/vladmandic/face-api/tree/master/model

### 4. Seed Database

```bash
node server/seeders/seed.js
```

This creates:
- Admin account: `admin@votesecure.com` / `Admin@1234`
- Sample General Election 2024 (status: online)
- 3 sample candidates

### 5. Start Development

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open: http://localhost:5173

## 🧭 Usage Guide

### Admin Flow
1. Go to `/admin/login`
2. Login with `admin@votesecure.com` / `Admin@1234`
3. Create election → Add candidates → Start election

### Voter Flow
1. Register at `/register` (captures face via webcam)
2. Login at `/login` with Voter ID
3. Go through Face Verification → Biometric → Cast Vote

### Officer Flow
1. Admin creates officer at `/admin/officers`
2. Officer logs in at `/officer/login`
3. Search voter → Verify face → Cast offline vote

## 🗃️ API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Voter registration |
| POST | `/api/auth/login` | Login (voter/admin/officer) |
| POST | `/api/auth/verify-otp` | Email OTP verification |
| GET | `/api/auth/me` | Get current user |

### Admin (requires admin JWT)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/dashboard` | Stats overview |
| CRUD | `/api/admin/candidates` | Manage candidates |
| CRUD | `/api/admin/elections` | Manage elections |
| POST | `/api/admin/officers` | Add polling officer |

### Voter (requires voter JWT)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/voter/election` | Active election + candidates |
| GET | `/api/voter/face-embedding` | Encrypted face data (for comparison) |
| POST | `/api/voter/vote` | Cast online vote |

### Results (public)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/results` | All ended elections |
| GET | `/api/results/:id` | Results for election |

## 🔒 Security Notes

1. **Face embeddings** are encrypted with AES-256 before storage
2. **Every vote** gets a SHA-256 integrity hash stored alongside it
3. **Biometric data** never leaves the device — WebAuthn uses secure enclave
4. **JWT tokens** expire in 7 days
5. **Helmet.js** adds security headers to all responses
6. **Rate limiting** should be added for production (express-rate-limit)

## 📦 Deployment

### Frontend (Vercel)
```bash
cd client && npm run build
# Deploy the dist/ folder to Vercel
```

### Backend (Render)
- Connect your GitHub repo
- Set environment variables in Render dashboard
- Deploy as a Web Service

---

Built with ❤️ using React + Node.js + face-api.js + WebAuthn
