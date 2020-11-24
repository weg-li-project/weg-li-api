function authorizeUser(user_id, authorization_header) {
    if (!user_id || !authorization_header) {
        return false;
    }

    return true;
}

module.exports = authorizeUser;