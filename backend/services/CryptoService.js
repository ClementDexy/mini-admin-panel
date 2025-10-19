import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Reference: https://nodejs.org/api/crypto.html#crypto_crypto_generatekeypairsync_type_options

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths for the RSA key files
const KEY_DIR = path.join(__dirname, '..', 'keys');
const PRIVATE_KEY_PATH = path.join(KEY_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEY_DIR, 'public.pem');

export class CryptoService {
    constructor() {
        this.ensureKeysExist();
        this.privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
        this.publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    }

    // Ensure the keys directory and key files exist, generate if they don't
    // Uses synchronous file operations for simplicity during initialization
    ensureKeysExist() {
        if (!fs.existsSync(KEY_DIR)) {
            fs.mkdirSync(KEY_DIR);
        }
        if (!fs.existsSync(PRIVATE_KEY_PATH) || !fs.existsSync(PUBLIC_KEY_PATH)) {
            console.log('RSA key pair not found. Generating new keys...');
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048, // 4096 bits is more secure but slower--in our case 2048 is sufficient
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
            });
            fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
            fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
        }
    }

    // Hash the user’s email using SHA-384
    hashEmail(email) {
        return crypto.createHash('sha384').update(email).digest();
    }

    // Sign an email hash with the private key
    signEmailHash(emailHash) {
        return crypto.sign('sha384', emailHash, { 
            key: this.privateKey,
            padding: crypto.constants.RSA_PKCS1_PADDING 
        });
    }

    // Verify the email hash signature with the public key
    verifyEmailHash(emailHash, signature) {
        try { 
            return crypto.verify('sha384', emailHash, { 
                key: this.publicKey,
                padding: crypto.constants.RSA_PKCS1_PADDING 
            }, signature);

        } catch {
            return false;
        }
    }

    // Getter for the public key
    getPublicKey() {
        return this.publicKey;
    }
}

