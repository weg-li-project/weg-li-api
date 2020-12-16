const crypto = require("crypto");
const bcrypt = require("bcrypt");
const UserDatabaseHandle = require("./database/database-users");

const HTTP_HEADER_MATCH_REGEX = "^Bearer .+$";
const HTTP_HEADER_EXTRACT_REGEX = "^Bearer (.+)$";

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
    return bcrypt.compareSync(access_token, hash);
}

Authorization.validateAuthorizationHeader = function (authorization_header) {
    if (authorization_header) {
        return authorization_header.match(HTTP_HEADER_MATCH_REGEX);
    }
}

/**
 * Extracts the access token from the Authorization header in an HTTP requests.
 *
 * @param authorization_header The value of the Authorization header.
 * @returns {string|null} The access token or <code>null</code> if none is found or the provided token is malformed.
 */
Authorization.extractAccessToken = function (authorization_header) {
    if (authorization_header) {
        let matches = authorization_header.match(HTTP_HEADER_EXTRACT_REGEX);

        if (matches && matches.length > 1) {
            return matches[1];
        }
    }

    return null;
}

/**
 * Stores a user's access criterion.
 *
 * @param user The User object whose access criterion should be stored.
 * @param access_token The user's access token.
 * @param transaction
 * @returns {Promise<void>}
 */
Authorization.storeAuthorization = async function (user, access_token, transaction = undefined) {
    let dbHandle = new UserDatabaseHandle();
    let hash = Authorization.hashAccessToken(access_token);
    await dbHandle.insertUserAccess(user, hash, transaction);
}

/**
 * Deletes a user's access criterion.
 *
 * @param user The user object whose access criterion should be deleted.
 * @param transaction
 * @returns {Promise<void>}
 */
Authorization.deleteAuthorization = async function (user, transaction = undefined) {
    let dbHandle = new UserDatabaseHandle();
    await dbHandle.deleteUserAccess(user, transaction);
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
    let dbHandle = new UserDatabaseHandle();
    let access_token_hash = await dbHandle.queryUserAccess(user);

    if (access_token_hash) {
        // Compare provided access token to actual access token hash and return
        return Authorization.compareAccessToken(access_token, access_token_hash.toString());
    } else {
        // No access token could be retrieved
        return false;
    }
}

module.exports = Authorization;