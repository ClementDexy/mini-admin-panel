import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProtobufService } from '../services/protobufService';

export const useVerifiedUsers = () => {
    const [users, setUsers] = useState([]);
    const [publicKey, setPublicKey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initialize = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch public key
                const publicKeyRes = await api.getPublicKey();
                setPublicKey(publicKeyRes.publicKey);

                // Fetch and process users
                const buffer = await api.exportUsers();
                const decodedUsers = await ProtobufService.decodeUserList(buffer);

                // Verify users
                const verifiedUsers = await ProtobufService.verifyUsers(decodedUsers, publicKeyRes.publicKey);
                setUsers(verifiedUsers);

            } catch (error) {
                console.error('Failed to initialize users:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, []);

    const refreshUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const buffer = await api.exportUsers();
            const decodedUsers = await ProtobufService.decodeUserList(buffer);
            const verifiedUsers = await ProtobufService.verifyUsers(decodedUsers, publicKey);
            setUsers(verifiedUsers);
        } catch (error) {
            console.error('Failed to refresh users:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return { users, publicKey, loading, error, refreshUsers, verifiedUsers: users.length };
};