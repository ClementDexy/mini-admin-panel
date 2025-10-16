export const validateUserInput = (data, isUpdate = false) => {
    const { email, role, status } = data;
    const validRoles = ['admin', 'user', 'manager'];
    const validStatuses = ['active', 'inactive'];

    const errors = [];

    if(!isUpdate || email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || typeof email !== 'string') {
            errors.push('Email is required and must be a valid string');
        } else if (!emailRegex.test(email)) {
            errors.push('Invalid email format');
        }
    }

    if(!isUpdate || role !== undefined) {
        if (!role || typeof role !== 'string') {
            errors.push('Role is required and must be a string');
        }
    }
    if(!isUpdate || status !== undefined) {
        if (!status || typeof status !== 'string') {
            errors.push('Status is required and must be a string');
        }
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
