export const convertToJSON = (data) => {
    return {
        ...data,
        email_hash: data.email_hash.toString('base64'),
        signature: data.signature.toString('base64')
    };
};
