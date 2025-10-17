import protobuf from 'protobufjs';
import { CryptoService } from './cryptoService';

export class ProtobufService {
    static async loadUserProto() {
        try {
            const root = await protobuf.load('/protos/user.proto');
            return root.lookupType('admin.UserList');
        } catch (error) {
            console.error('Error loading user proto:', error);
            throw new Error(`Failed to load user proto: ${error.message}`);
        }
    }

    static async decodeUserList(buffer) {
        try {
            const UserList = await this.loadUserProto();
            const uint8 = new Uint8Array(buffer);
            const decoded = UserList.decode(uint8);

            return decoded.users.map(user => ({
                id: user.id,
                email: user.email,
                emailHash: user.email_hash,
                role: user.role,
                status: user.status,
                createdAt: user.created_at,
                signature: user.signature
            }));
        } catch (error) {
            console.error('Error decoding user list:', error);
            throw new Error(`Failed to decode user list: ${error.message}`);
        }
    }

    static async verifyUsers(users, pemPublicKey) {
        if (!pemPublicKey) {
            throw new Error('Public key is required for verification');
        }
        const verifPromises = users.map( async (user) =>{
            try {
                const isValid = await CryptoService.verifyUser(user, pemPublicKey);
                if (!isValid) {
                    console.warn(`User with email ${user.email} failed verification.`);
                }
                return {user, isValid};
            } catch (error) {
                console.error(`Error verifying user ${user.email}:`, error);
                return {user, isValid: false};
            }
        });

        const results = await Promise.allSettled(verifPromises);

        return results.filter(result => result.status === 'fulfilled')
                      .map(result => result.value)
                      .filter(({isValid}) => isValid)
                      .map(({user}) => user);
    }
}