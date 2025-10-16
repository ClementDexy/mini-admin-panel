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

// GET /api/users/stats/7d-users - Fetch users created in the last 7 days
app.get('/api/users/stats/7d-users', (req, res) => {
    try {
        // Last 7 days in milliseconds
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const stats = userStatements.selectStats.all(sevenDaysAgo);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users in last 7 days', error: error.message });
    }
});

// GET /api/users/:id - Get user by ID
app.get('/api/users/:id', (req, res) => {
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
        const { email, role, status } = req.body;
        if (!email || !role || !status) {
            return res.status(400).json({ error: 'Email, role, and status are required' });
        }
        const emailHash = cryptoService.hashEmail(email);
        const signature = cryptoService.signEmailHash(emailHash);
        const createdAt = Date.now();

        const result = userStatements.insertUser.run(email, emailHash, role, status, createdAt, signature);
        const newUser = userStatements.selectUserById.get(result.lastInsertRowid);
        res.status(201).json(convertToJSON(newUser));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user', error: error.message });
    }
});

// Protobuf export of all users
app.get('/api/users/export', (req, res) => {
    try {
        const users = userStatements.selectAllUsers.all();
        const buffer = encodeUserList(users);
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

        const emailHash = cryptoService.hashEmail(email);
        const signature = cryptoService.signEmailHash(emailHash);

        // if email is changed, re-sign the hash
        if (email && email !== existingUser.email) {
            signature = cryptoService.signEmailHash(emailHash);
        }

        userStatements.updateUser.run(email, emailHash, role, status, signature, id);
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
        const existingUser = userStatements.selectUserById.get(parseInt(id));
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        userStatements.deleteUser.run(parseInt(id));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user', error: error.message });
    }
});

// GET /users/export - Export users in protobuf format

app.get('/api/users/export', (req, res) => {
    try {
        const users = userStatements.selectAllUsers.all();
        const buffer = encodeUserList(users);
        res.setHeader('Content-Type', 'application/x-protobuf');
        res.setHeader('Content-Disposition', 'attachment; filename=users.db');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export users', error: error.message });
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
        res.json({ status: 'OK',
            database: 'connected',
            timestamp: new Date().toISOString() });
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
