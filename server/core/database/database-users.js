const { Database } = require("./database")
const dbConst = require("./database-const")

/**
 *
 * @param database
 * @constructor
 */
function UserDatabaseHandle(database = Database.shared) {
    this.database = database;
}

/**
 *
 * @param user
 * @param transaction
 * @returns {Promise<void>}
 */
UserDatabaseHandle.prototype.createUser = async function (user, transaction = this.database.knex) {
    let userInsertData = {};
    userInsertData[dbConst.DB_TABLE_USERS_ID] = user.id;
    userInsertData[dbConst.DB_TABLE_USERS_CREATION] = this.database.knex.raw("CURRENT_TIMESTAMP");

    await transaction(dbConst.DB_TABLE_USERS).insert(userInsertData);
}

/**
 *
 * @param user
 * @param transaction
 * @returns {Promise<void>}
 */
UserDatabaseHandle.prototype.deleteUser = async function (user, transaction = this.database.knex) {
    let whereClause = {};
    whereClause[dbConst.DB_TABLE_USERS_ID] = user.id;
    await transaction(dbConst.DB_TABLE_USERS).where(whereClause).del();
}

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
 *
 * @param user
 * @param access_token_hash
 * @param transaction
 * @returns {Promise<void>}
 */
UserDatabaseHandle.prototype.insertUserAccess = async function (user, access_token_hash,
                                                                transaction = this.database.knex) {
    let insertData = {};
    insertData[dbConst.DB_TABLE_USER_ACCESS_USER_ID] = user.id;
    insertData[dbConst.DB_TABLE_USER_ACCESS_TOKEN] = access_token_hash;
    await transaction(dbConst.DB_TABLE_USER_ACCESS).insert(insertData);
}

/**
 *
 * @param user
 * @param transaction
 * @returns {Promise<void>}
 */
UserDatabaseHandle.prototype.deleteUserAccess = async function (user, transaction = this.database.knex) {
    let whereClause = {};
    whereClause[dbConst.DB_TABLE_USER_ACCESS_USER_ID] = user.id;
    await transaction(dbConst.DB_TABLE_USER_ACCESS).where(whereClause).del();
}

module.exports = UserDatabaseHandle;