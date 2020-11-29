const { Database } = require("./database")
const dbConst = require("./database-const")

/**
 * Database handle class for user-related requests.
 *
 * @param database
 * @constructor
 * @author Lukas Trommer
 */
function UserDatabaseHandle(database = Database.shared) {
    this.database = database;
}

/**
 * Inserts a new user in the database.
 *
 * @param user The user for which should be inserted.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<void>}
 * @author Lukas Trommer
 */
UserDatabaseHandle.prototype.insertUser = async function (user, transaction = this.database.knex) {
    let letInsertData = {};
    letInsertData[dbConst.DB_TABLE_USERS_ID] = user.id;
    letInsertData[dbConst.DB_TABLE_USERS_CREATION] = this.database.knex.raw("CURRENT_TIMESTAMP");

    await transaction(dbConst.DB_TABLE_USERS).insert(letInsertData);
}

/**
 * Deletes a user from the database.
 *
 * @param user The user who should be deleted.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<void>}
 * @author Lukas Trommer
 */
UserDatabaseHandle.prototype.deleteUser = async function (user, transaction = this.database.knex) {
    let whereClause = {};
    whereClause[dbConst.DB_TABLE_USERS_ID] = user.id;
    await transaction(dbConst.DB_TABLE_USERS).where(whereClause).del();
}

/**
 * Queries a user's access record from the database.
 *
 * @param user The user whose access record should be queried.
 * @returns {Promise<string|null>}
 * @author Lukas Trommer
 */
UserDatabaseHandle.prototype.queryUserAccess = async function (user) {
    let whereClause = {};
    whereClause[dbConst.DB_TABLE_USER_ACCESS_USER_ID] = user.id;
    let response = await this.database.knex(dbConst.DB_TABLE_USER_ACCESS).where(whereClause);

    if (response && response.length > 0) {
        let binary_hash = response[0][dbConst.DB_TABLE_USER_ACCESS_TOKEN];
        return binary_hash ? binary_hash.toString() : null;
    }
}

/**
 * Inserts a new user's access record into the database.
 *
 * @param user The user whose access record should be inserted.
 * @param access_token_hash The relating access token hash.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<void>}
 * @author Lukas Trommer
 */
UserDatabaseHandle.prototype.insertUserAccess = async function (user, access_token_hash,
                                                                transaction = this.database.knex) {
    let insertData = {};
    insertData[dbConst.DB_TABLE_USER_ACCESS_USER_ID] = user.id;
    insertData[dbConst.DB_TABLE_USER_ACCESS_TOKEN] = access_token_hash;
    await transaction(dbConst.DB_TABLE_USER_ACCESS).insert(insertData);
}

/**
 * Deletes a user's access record from the database.
 *
 * @param user The user whose access record should be deleted.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<void>}
 * @author Lukas Trommer
 */
UserDatabaseHandle.prototype.deleteUserAccess = async function (user, transaction = this.database.knex) {
    let whereClause = {};
    whereClause[dbConst.DB_TABLE_USER_ACCESS_USER_ID] = user.id;
    await transaction(dbConst.DB_TABLE_USER_ACCESS).where(whereClause).del();
}

module.exports = UserDatabaseHandle;