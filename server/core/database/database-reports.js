const { Database } = require("./database")
const dbConst = require("./database-const")

/**
 *
 * @param database
 * @constructor
 */
function ReportDatabaseHandle(database = Database.shared) {
    this.database = database;
}

/**
 *
 * @param user
 * @returns {Promise<*[]>}
 */
ReportDatabaseHandle.prototype.getUserReportImageTokens = async function (user) {
    // TODO: Implement
    return [];
}

/**
 *
 * @returns {Promise<void>}
 */
ReportDatabaseHandle.prototype.deleteUserReports = async function () {
    // TODO: Implement
}

module.exports = ReportDatabaseHandle;