# Mini Admin Panel

A full-stack admin panel with user management, cryptographic signature verification, and Protocol Buffers integration.

---

## 🌟 Features

- **User Management:** Complete CRUD operations for users  
- **Cryptographic Security:** SHA-384 email hashing with RSA digital signatures  
- **Protocol Buffers:** Efficient data serialization for user exports  
- **Data Visualization:** User creation charts and statistics  
- **Signature Verification:** Frontend cryptographic verification of user data  

---

## 🧰 Tech Stack

### Backend
- Node.js with Express.js  
- SQLite with better-sqlite3  
- Protocol Buffers for data serialization  
- RSA digital signatures with SHA-384 hashing  

### Frontend
- React.js with Bootstrap  
- Protocol Buffers decoding  
- Web Crypto API for signature verification  
- Recharts for data visualization  

---

## ⚙️ Setup & Run Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm start
```
Backend runs at **http://localhost:3001**

Automatic Setup:
- Database file (`users.db`) auto-created  
- RSA keypair generated in `/keys`  
- Sample data initialized on first run  

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at **http://localhost:3000**

### Access the Application
- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:3001/api  
- **Protobuf Export:** http://localhost:3001/users/export  

---

## 🧩 API Endpoints

### User Management (REST API)
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | /api/users | Get all users |
| GET | /api/user/:id | Get user by ID |
| POST | /api/users | Create new user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |
| GET | /api/users/created7days | User creation stats (7 days) |

### Protobuf & System
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | /api/users/export | Export users in protobuf format |
| GET | /api/public-key | Get RSA public key |
| GET | /api/health | Health check |

---

## 🔐 Cryptographic Features

### Backend Operations
1. **Email Hashing:** SHA-384 hashing on user emails  
2. **Digital Signatures:** RSA signature over each email hash  
3. **Key Management:** RSA keypair generated at backend startup  

### Frontend Verification
1. **Protobuf Decoding:** Decode users from binary protobuf data  
2. **Signature Verification:** Verify user signatures with Web Crypto API  
3. **Hash Validation:** Recompute email hash for integrity check  
4. **Display Logic:** Only verified users are displayed  

---

## 🗄️ Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  email_hash BLOB NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  signature BLOB NOT NULL
);
```

---

## 📦 Protocol Buffers Schema

```proto
syntax = "proto3";
package admin;

message User {
  uint32 id = 1;
  string email = 2;
  bytes email_hash = 3;
  string role = 4;
  string status = 5;
  int64 created_at = 6;
  bytes signature = 7;
}

message UserList {
  repeated User users = 1;
}
```

---

## 💡 Assumptions & Design Decisions

### Security Architecture
1. Frontend performs crypto verification per requirements (not typical for prod)  
2. RSA keys stored in `/keys` (replace with secure vault in production)  
3. Email hashes stored as binary BLOBs  

### Data Handling
1. Timestamps use Unix milliseconds  
2. Binary fields stored as BLOBs  
3. Protobuf optimized with binary fields  

### Development Decisions
- SQLite for simplicity  
- better-sqlite3 for synchronous fast queries  
- Bootstrap for styling  
- Web Crypto API for cryptographic operations  

---

## 🧪 Development Notes

### File Generation
- **Database:** auto-created  
- **RSA Keys:** auto-generated on first start  
- **Protobuf Files:** shared between backend and frontend  

### Error Handling
- Graceful fallback on crypto errors  
- User-friendly UI messages  

### Performance
- Prepared statements in DB  
- Efficient protobuf serialization  
- Parallel signature verification in frontend  

---

## 🧭 Troubleshooting

| Issue | Cause | Fix |
|--------|-------|-----|
| **Port in use** | Another app running | Change port in backend or frontend config |
| **Database errors** | Corrupt DB file | Delete `users.db` (auto-regenerated) |
| **Crypto errors** | Bad keypair | Delete `/keys` folder to regenerate |
| **Protobuf decode failure** | Mismatched schema | Ensure same `user.proto` in both sides |

### Verification Steps
```bash
# Check backend health
curl http://localhost:3001/api/health

# Export users in protobuf
curl http://localhost:3001/users/export --output users.pb
```

---

## 🧾 License
MIT License © 2025 Mini Admin Panel Project
