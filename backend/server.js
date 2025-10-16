import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET  /api/users          - Get all users');
    console.log('  GET  /api/users/:id      - Get user by ID');
    console.log('  POST /api/users          - Create new user');
    console.log('  PUT  /api/users/:id      - Update user');
    console.log('  DELETE /api/users/:id    - Delete user');
    console.log('  GET  /api/users/stats    - Get created user statistics in 7 days');
    console.log('  GET  /api/users/count    - Get user counts');
    console.log('  GET  /api/users/export   - Export users (protobuf)');
    console.log('  GET  /api/public-key     - Get public key');
    console.log('  GET  /api/health         - Health check');
});
