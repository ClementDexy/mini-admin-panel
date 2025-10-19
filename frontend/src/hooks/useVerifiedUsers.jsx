import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { ProtobufService } from '../services/protobufService';

export const useVerifiedUsers = () => {
    const [users, setUsers] = useState([]);
    const [publicKey, setPublicKey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

    useEffect(() => {

        mountedRef.current = true;
        const initialize = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetching public key...
                const { publicKey } = await api.getPublicKey();
                setPublicKey(publicKey);

                // Downloading user data...
                const buffer = await api.exportUsers();

                // Decoding and verifying users...
                const decodedUsers = await ProtobufService.decodeUserList(buffer);
                const verified = await ProtobufService.verifyUsers(decodedUsers, publicKey);

                //  Verified users loaded successfully.
                setUsers(verified);
                

            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        initialize();
        return () => { mountedRef.current = false; };
    }, []);

    const refreshUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            // Ensure we have a public key
            let key = publicKey;
            if (!key) {
                const publicKeyRes = await api.getPublicKey();
                key = publicKeyRes.publicKey;
                if (!mountedRef.current) return;
                setPublicKey(key);
            }
            const buffer = await api.exportUsers();
            const decodedUsers = await ProtobufService.decodeUserList(buffer);
            const verifiedUsers = await ProtobufService.verifyUsers(decodedUsers, key);
            if (!mountedRef.current) return;
            setUsers(verifiedUsers);
        } catch (error) {
            console.error('Failed to refresh users:', error);
            setError(error?.message ?? String(error));
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    };

    return { users, publicKey, loading, error, refreshUsers, verifiedCount: users.length };
};