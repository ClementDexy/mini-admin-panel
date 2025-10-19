export class CryptoService {

  static toUint8(input) {
    if (!input) return new Uint8Array();
    if (input instanceof Uint8Array) return input;

    try {
      if (typeof input === 'string') {
        return Uint8Array.from(atob(input), c => c.charCodeAt(0));
      }
      if (ArrayBuffer.isView(input)) {
        return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
      }
      if (input.buffer instanceof ArrayBuffer) return new Uint8Array(input.buffer);
      return new Uint8Array(input);
    } catch {
      console.warn('⚠️ Failed to convert input to Uint8Array');
      return new Uint8Array();
    }
  }

  static async importRsaPublicKey(pem) {
    try {
      const base64 = pem
        .replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\\s+/g, '');
      const binaryDer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

      return await crypto.subtle.importKey(
        'spki',
        binaryDer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384' },
        false,
        ['verify']
      );
    } catch (err) {
      throw new Error('Invalid or corrupted public key.');
    }
  }

  static async verifySignature(publicKey, data, signature) {
    const bytesData = this.toUint8(data);
    const bytesSig = this.toUint8(signature);

    if (!bytesData.length || !bytesSig.length) {
      throw new Error('Data or signature is empty or invalid');
    }

    return crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384' },
      publicKey,
      bytesSig,
      bytesData
    );
  }

  static async verifyUser(user, pemPublicKey) {
    if (!pemPublicKey) throw new Error('Public key is required for verification.');

    try {
      const publicKey = await this.importRsaPublicKey(pemPublicKey);

      const data = user.emailHash || user.email_hash;
      const signature = user.signature;

      if (!data || !signature) {
        throw new Error('User data or signature missing.');
      }

      const verified = await this.verifySignature(publicKey, data, signature);
      return verified;
    } catch (err) {
      console.error(`❌ Verification failed for ${user.email}:`, err);
      throw new Error(`Failed to verify user: ${err.message}`);
    }
  }
}
