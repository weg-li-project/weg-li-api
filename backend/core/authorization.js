function Authorization() { }

/**
 * This function extracts the access token from the Authorization header in an HTTP requests and checks for its
 * validity.
 *
 * @param authorization_header The value of the Authorization header.
 * @returns {string|null} The access token or <code>null</code> if none is found or the provided token is malformed.
 */
Authorization.extractAccessToken = function (authorization_header) {
    if (authorization_header) {
        // TODO: Update RegEx
        let matches = authorization_header.match("^Bearer (.*)$");

        if (matches && matches.length > 1) {
            return matches[1];
        }
    }

    return null;
}

Authorization.authorizeUser = function (user) {
    if (!user) {
        return false;
    }

    // TODO: Implement authorization

    return true;
}

module.exports = Authorization;