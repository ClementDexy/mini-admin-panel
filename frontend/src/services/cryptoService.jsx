export class CryptoService {
    static async importRsaPublicKey(pem) {
        try {
            const b64 = pem
                .replace('-----BEGIN PUBLIC KEY-----', '')
                .replace('-----END PUBLIC KEY-----', '')
                .replace(/\s+/g, '');
            const binaryDerString = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            return await window.crypto.subtle.importKey(
                'spki',
                binaryDerString,
                {
                    name: 'RSASSA-PKCS1-v1_5',
                    hash: 'SHA-384',
                },
                false,
                ['verify']
            );
        } catch (error) {
            console.error('Error importing RSA public key:', error);
            throw new Error(`Failed to import RSA public key: ${error.message}`);
        }
    }

    static async verifySignature(publicKey, data, signature) {
        try {
            return await crypto.subtle.verify({
                name: 'RSASSA-PKCS1-v1_5',
                hash: 'SHA-384',
            }, publicKey, signature, data);
        } catch (error) {
            console.error('Error verifying signature:', error);
            throw new Error(`Failed to verify signature: ${error.message}`);
        }
    }

    static async verifyUser(user, pemPublicKey) {
        if (!pemPublicKey) {
            throw new Error('Public key is required for verification');
        }

        try {
            const publicKey = await this.importRsaPublicKey(pemPublicKey);
            const isValid = await this.verifySignature(
                publicKey,
                user.emailHash,
                user.emailSignature
            );
            return isValid;
        } catch (error) {
            console.error('Error verifying user:', error);
            throw new Error(`Failed to verify user: ${error.message}`);
        }
    }
}