const crypto = require("crypto")
const bcrypt = require("bcrypt")

function Authorization() { }

/**
 * Generates a new access token.
 *
 * @returns {string} The newly generated access token.
 */
Authorization.generateAccessToken = function () {
    return crypto.randomBytes(32).toString("hex")
}

/**
 * Hashes a provided access token.
 *
 * @param access_token The access token that should be hashed.
 * @returns {string} The hash value of that access token.
 */
Authorization.hashAccessToken = function (access_token) {
    return bcrypt.hashSync(access_token, 10)
}

/**
 * Compares a given access token to a provided access token hash value.
 *
 * @param access_token The access token that should be validated.
 * @param hash The hashed access token for comparison.
 * @returns {boolean} <code>true</code> if the access token is associated to the provided hash, <code>false</code>
 * otherwise.
 */
Authorization.compareAccessToken = function (access_token, hash) {
    return bcrypt.compareSync(access_token, hash)
}

/**
 * Extracts the access token from the Authorization header in an HTTP requests.
 *
 * @param authorization_header The value of the Authorization header.
 * @returns {string|null} The access token or <code>null</code> if none is found or the provided token is malformed.
 */
Authorization.extractAccessToken = function (authorization_header) {
    if (authorization_header) {
        let matches = authorization_header.match("^Bearer (.+)$");

        if (matches && matches.length > 1) {
            return matches[1];
        }
    }

    return null;
}

/**
 * Stores a user's access token hash.
 * @param user The user object for which the access token hash should be stored.
 * @param access_token The access token hash.
 * @returns {Promise<void>}
 */
Authorization.storeAuthorization = async function (user, access_token) {
    // TODO: Store access token hash in database
}

/**
 * Authorize a user-related request by comparing the provided access token with the user's actual access token hash.
 * @param user The user object for which the authorization should be performed.
 * @param access_token The provided access token for the request.
 * @returns {Promise<boolean>} <code>true</code> if the request is authorized, <code>false</code> otherwise
 */
Authorization.authorizeUser = async function (user, access_token) {
    if (!user || !access_token) {
        return false;
    }

    // Retrieve access token from database
    // TODO: Retrieve access token hash from database
    let access_token_hash = Authorization.hashAccessToken(access_token);

    // Compare provided access token to actual access token hash and return
    return Authorization.compareAccessToken(access_token, access_token_hash);
}

module.exports = Authorization;