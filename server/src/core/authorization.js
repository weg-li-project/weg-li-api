const crypto = require('crypto');
const bcrypt = require('bcrypt');
const UserDatabaseHandle = require('./database/database-users');

const HTTP_HEADER_MATCH_REGEX = /^Bearer .+$/;
const HTTP_HEADER_EXTRACT_REGEX = /^Bearer (.+)$/;

function Authorization() {}

/**
 * Generates a new access token.
 *
 * @author Lukas Trommer
 * @returns {string} The newly generated access token.
 */
Authorization.generateAccessToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hashes a provided access token.
 *
 * @author Lukas Trommer
 * @param accessToken The access token that should be hashed.
 * @returns {string} The hash value of that access token.
 */
Authorization.hashAccessToken = function (accessToken) {
  return bcrypt.hashSync(accessToken, 10);
};

/**
 * Compares a given access token to a provided access token hash value.
 *
 * @author Lukas Trommer
 * @param accessToken The access token that should be validated.
 * @param hash The hashed access token for comparison.
 * @returns {boolean} <code>true</code> if the access token is associated to the
 *     provided hash, <code>false</code> otherwise.
 */
Authorization.compareAccessToken = function (accessToken, hash) {
  return bcrypt.compareSync(accessToken, hash);
};

/**
 * Validates the Authorization header in an HTTP requests.
 *
 * @author Lukas Trommer
 * @param authorizationHeader The value of the Authorization header.
 * @returns {boolean} <code>true</code> if the header is valid,
 *     <code>false</code> otherwise.
 */
Authorization.validateAuthorizationHeader = function (authorizationHeader) {
  if (authorizationHeader) {
    return authorizationHeader.match(HTTP_HEADER_MATCH_REGEX) != null;
  }
  return false;
};

/**
 * Extracts the access token from the Authorization header in an HTTP request.
 *
 * @author Lukas Trommer
 * @param authorizationHeader The value of the Authorization header.
 * @returns {string | null} The access token or <code>null</code> if none is
 *     found or the provided token is malformed.
 */
Authorization.extractAccessToken = function (authorizationHeader) {
  if (authorizationHeader) {
    const matches = authorizationHeader.match(HTTP_HEADER_EXTRACT_REGEX);

    if (matches && matches.length > 1) {
      return matches[1];
    }
  }

  return null;
};

/**
 * Stores a user's access criterion.
 *
 * @author Lukas Trommer
 * @param user The User object whose access criterion should be stored.
 * @param accessToken The user's access token.
 * @param transaction
 * @returns {Promise<void>}
 */
Authorization.storeAuthorization = async function (
  user,
  accessToken,
  transaction = undefined
) {
  const dbHandle = new UserDatabaseHandle();
  const hash = Authorization.hashAccessToken(accessToken);
  await dbHandle.insertUserAccess(user, hash, transaction);
};

/**
 * Deletes a user's access criterion.
 *
 * @author Lukas Trommer
 * @param user The user object whose access criterion should be deleted.
 * @param transaction
 * @returns {Promise<void>}
 */
Authorization.deleteAuthorization = async function (
  user,
  transaction = undefined
) {
  const dbHandle = new UserDatabaseHandle();
  await dbHandle.deleteUserAccess(user, transaction);
};

/**
 * Authorize a user-related request by comparing the provided access token with
 * the user's actual access token hash.
 *
 * @author Lukas Trommer
 * @param user The user object for which the authorization should be performed.
 * @param accessToken The provided access token for the request.
 * @returns {Promise<boolean>} <code>true</code> if the request is authorized,
 *     <code>false</code> otherwise
 */
Authorization.authorizeUser = async function (user, accessToken) {
  if (!user || !accessToken) {
    return false;
  }

  // Retrieve access token from database
  const dbHandle = new UserDatabaseHandle();
  const accessTokenHash = await dbHandle.queryUserAccess(user);

  if (accessTokenHash) {
    // Compare provided access token to actual access token hash and return
    return Authorization.compareAccessToken(
      accessToken,
      accessTokenHash.toString()
    );
  }
  // No access token could be retrieved
  return false;
};

module.exports = Authorization;
