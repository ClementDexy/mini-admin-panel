import protobuf from 'protobufjs';
import { CryptoService } from './cryptoService';

export class ProtobufService {
    // Reference: https://protobufjs.github.io/protobuf.js/manual.html#loading
    static async loadUserProto() {
        try {
            const baseUrl =
                (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
                    ? import.meta.env.BASE_URL
                    : '/';
            const protoUrl = `${baseUrl.replace(/\/?$/, '/') }protos/user.proto`;

            const res = await fetch(protoUrl);
            if (!res.ok) {
                throw new Error(`Failed to fetch proto file: ${res.status} ${res.statusText}`);
            }

            const protoText = await res.text();
            const { root } = protobuf.parse(protoText, { keepCase: true });

            return root.lookupType('admin.UserList'); // adjust if your schema type is different
        } catch (error) {
            throw new Error(`Unable to load protobuf schema: ${error.message}`);
        }
    }

    // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array

    /* Convert various data types to a Uint8Array and used for protobuf encoding
    and consistency */
    static toUint8(data) {
        try {
            if (!data) return new Uint8Array();
            if (data instanceof Uint8Array) return data;
            if (typeof data === 'string') {
                return Uint8Array.from(atob(data), c => c.charCodeAt(0));
            }
            if (data instanceof ArrayBuffer) return new Uint8Array(data);
            if (ArrayBuffer.isView(data)) {
                return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            }
            if (typeof data === 'object' && data !== null && data.buffer instanceof ArrayBuffer) {
                return new Uint8Array(data.buffer);
            }
            return new Uint8Array(data);
        } catch {
            return new Uint8Array();
        }
    }

    // Reference: https://protobufjs.github.io/protobuf.js/manual.html#decoding

    static async decodeUserList(buffer) {
        try {
            const UserList = await this.loadUserProto();
            const bytes = new Uint8Array(buffer);
            const decoded = UserList.decode(bytes);
           
            return decoded.users.map(u => {
                const emailHash = this.toUint8(u.email_hash);
                const signature = this.toUint8(u.signature);

                // normalize created_at (protobuf int64 may be Long/string/number or ISO)
                const rawCreated = u.created_at ?? u.createdAt ?? null;
                let createdAt = null;
                if (rawCreated != null) {
                    if (typeof rawCreated === 'object' && typeof rawCreated.toNumber === 'function') {
                        createdAt = rawCreated.toNumber();
                    } else if (typeof rawCreated === 'string') {
                        if (/^[0-9]+$/.test(rawCreated)) {
                            createdAt = Number(rawCreated);
                        } else {
                            const parsed = Date.parse(rawCreated);
                            createdAt = isNaN(parsed) ? null : parsed;
                        }
                    } else if (typeof rawCreated === 'number') {
                        createdAt = rawCreated;
                    }
                }

                // Normalize units: if value looks like seconds (<= 10^11) convert to ms
                if (typeof createdAt === 'number' && createdAt > 0 && createdAt < 1e11) {
                    createdAt = createdAt * 1000;
                }

                return {
                    id: u.id,
                    email: u.email,
                    emailHash,
                    signature,
                    role: u.role,
                    status: u.status,
                    createdAt,
                };
            });
        } catch (error) {
            throw new Error(`Failed to decode protobuf data: ${error.message}`);
        }
    }
// Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
    static async verifyUsers(users, publicKeyPem) {
        if (!publicKeyPem) throw new Error('Missing public key for verification.');

        const verificationResults = await Promise.allSettled(
            users.map(async (u) => {
                try {
                    const valid = await CryptoService.verifyUser(u, publicKeyPem);
                    if (!valid) {
                        console.warn(`⚠️ Signature verification failed for ${u.email}`);
                        return { user: u, isValid: false };
                    }
                    return { user: u, isValid: valid };
                } catch (err) {
                    return { user: u, isValid: false };
                }
            })
        );

        return verificationResults
            .filter(r => r.status === 'fulfilled' && r.value.isValid)
            .map(r => r.value.user);
    }
}