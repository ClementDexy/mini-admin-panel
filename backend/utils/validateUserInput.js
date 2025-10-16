export const validateUserInput = (data, isUpdate = false) => {
    const { email, role, status } = data;
    const validRoles = ['admin', 'user', 'manager'];
    const validStatuses = ['active', 'inactive'];

    const errors = [];

    if (!email || typeof email !== 'string') {
        errors.push('Invalid email');
    }

    if (!validRoles.includes(role)) {
        errors.push(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);
    }

    if (!validStatuses.includes(status)) {
        errors.push(`Invalid status. Valid statuses are: ${validStatuses.join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
