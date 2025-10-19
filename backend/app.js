import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import db, { userStatements } from './config/db.js';
import { CryptoService } from './services/CryptoService.js';
import { loadUserProtoSchema, encodeUserList, decodeUserList } from './services/protoService.js';
import { convertToJSON } from './utils/convertToJSON.js';
import { validateUserInput } from './utils/validateUserInput.js';


dotenv.config();

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(bodyParser.json());
app.use(helmet());

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 10 minutes)
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

const cryptoService = new CryptoService(); // Initialize the CryptoService
await loadUserProtoSchema(); // Load the protobuf schema

// 1. User Management (CRUD Endpoints)

// GET /api/users - Get all users
app.get('/api/users', (req, res) => {
    try {
        const users = userStatements.selectAllUsers.all();
        const jsonUsers = users.map(convertToJSON);
        res.json(jsonUsers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users', error: error.message });
    }
});

// GET /api/users/count - Get user counts
app.get('/api/users/count', (req, res) => {
    try {
        const total = userStatements.countUsers.get().count;
        const byRole = userStatements.countUsersByRole.all();
        const byStatus = userStatements.countUsersByStatus.all();

        res.json({ total, byRole, byStatus });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user count', error: error.message });
    }
});

// GET /api/users/created7days - returns [{ date: "YYYY-MM-DD", count: N }, ...] for last 7 days
app.get('/api/users/created7days', (req, res) => {
  try {
    const days = 7;
    const today = new Date();
    const dates = [];
    const counts = {};

    // Build last `days` dates (YYYY-MM-DD) and initialize counts
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      dates.push(isoDate);
      counts[isoDate] = 0;
    }

    // Calculate the start timestamp (7 days ago at 00:00:00)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    const startTimestamp = startDate.getTime(); // Convert to milliseconds

    // Fetch rows created since startTimestamp
    // created_at is stored as milliseconds (Unix timestamp)
    const rows = userStatements.selectStats.all(startTimestamp);

    // Count by day
    rows.forEach(row => {
      if (!row || !row.created_at) return;
      
      // Convert milliseconds to Date object
      const createdDate = new Date(row.created_at);
      const day = createdDate.toISOString().slice(0, 10);
      
      if (Object.prototype.hasOwnProperty.call(counts, day)) {
        counts[day] += 1;
      }
    });

    const result = dates.map(d => ({ date: d, count: counts[d] || 0 }));
    
    console.log('Final result:', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute users created per day' });
  }
});

// GET /api/user/:id - Get user by ID
app.get('/api/user/:id', (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        const user = userStatements.selectUserById.get(parseInt(id));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(convertToJSON(user));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user', error: error.message });
    }
});

// POST /api/users - Create a new user
app.post('/api/users', (req, res) => {
    try {
        const { email, role = 'user', status = 'active' } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email required, your role is set to user and status is set to active' });
        }

        const existingUser = userStatements.getUserByEmail.get(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        // Validate user input
        const errors = validateUserInput({ email, role, status });
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        // Generate the cryptographic data and timestamps
        const emailHash = cryptoService.hashEmail(email);
        const signature = cryptoService.signEmailHash(emailHash);
        const createdAt = Date.now();

        // Insert the new user into the database
        const result = userStatements.insertUser.run(email, emailHash, role, status, createdAt, signature);

        if (!result || !result.lastInsertRowid) {
            throw new Error('Failed to insert user');
        }

        // Fetch and return the newly created user
        const newUser = userStatements.selectUserById.get(result.lastInsertRowid);
        res.status(201).json(convertToJSON(newUser));

    } catch (error) {
        res.status(500).json({ error: 'Failed to create user', error: error.message });
    }
});

// GET /api/users/export - Protobuf export of all users
app.get('/api/users/export', (req, res) => {
    try {
        const users = userStatements.selectAllUsers.all();
        const buffer = encodeUserList(users);

        // Set the appropriate headers for Protobuf
        res.setHeader('Content-Type', 'application/x-protobuf');
        res.setHeader('Content-Disposition', 'attachment; filename=users.db');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export users', error: error.message });
    }
});

// PUT /api/users/:id - Update a user
app.put('/api/users/:id', (req, res) => {
    try {
        const { email, role, status } = req.body;
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Validate user input
        const errors = validateUserInput({ email, role, status }, true);
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        if (!email || !role || !status) {
            return res.status(400).json({ error: 'Email, role, and status are required' });
        }

        // Check if user exists
        const existingUser = userStatements.selectUserById.get(parseInt(id));
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        let emailHash = existingUser.email_hash;
        let signature = existingUser.signature;
        let updatedEmail = email || existingUser.email;
        

        // if email is changed, re-sign the hash
        if (email && email !== existingUser.email) {
            const userEmail = userStatements.getUserByEmail.get(email);
            if (userEmail && userEmail.id !== parseInt(id)) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            emailHash = cryptoService.hashEmail(email);
            signature = cryptoService.signEmailHash(emailHash);
        }

        userStatements.updateUser.run(updatedEmail, emailHash, role, status, signature, parseInt(id));
        const updatedUser = userStatements.selectUserById.get(parseInt(id));
        res.json(convertToJSON(updatedUser));
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user', error: error.message });
    }
});

// DELETE /api/users/:id - Delete a user
app.delete('/api/users/:id', (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Check if user exists
        const existingUser = userStatements.selectUserById.get(parseInt(id));
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete the user
        userStatements.deleteUserById.run(parseInt(id));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user', error: error.message });
    }
});

// GET /api/public-key - Get the public key
app.get('/api/public-key', (req, res) => {
    try {
        const publicKey = cryptoService.getPublicKey();
        res.json({ publicKey });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve public key', error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    try {
        // Test database connection
        userStatements.countUsers.get();
        res.json({ 
            status: 'OK',
            database: 'connected',
            timestamp: new Date().toISOString(),
            server_time: Date.now()
         });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR',
            database: 'disconnected',
            error: 'Failed to check health', 
            error: error.message 
        });
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    db.close();
    process.exit(0);
});

export default app;
