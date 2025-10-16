export const convertToJSON = (data) => {
    return {
        ...data,
        email_hash: data.email_hash.toString('base64'),
        signature: data.signature.toString('base64'),
        created_at: new Date(data.created_at).toISOString()
    };
};
