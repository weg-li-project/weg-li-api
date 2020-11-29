const { Database } = require("./database")
const dbConst = require("./database-const")

/**
 * Database handle class for report-related requests.
 *
 * @param database
 * @constructor
 */
function ReportDatabaseHandle(database = Database.shared) {
    this.database = database;
}

/**
 * Returns the image tokens that a related to a user's reports.
 *
 * @param user The user whose related image tokens should be retrieved.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<*[string]>} The string array of image tokens.
 */
ReportDatabaseHandle.prototype.queryUserReportImageTokens = async function (user, transaction = this.database.knex) {
    let selectClause = [dbConst.DB_TABLE_REPORTS_IMAGE_TOKEN]

    let whereClause = {};
    whereClause[dbConst.DB_TABLE_REPORTS_USER_ID] = user.id;

    let result = await transaction(dbConst.DB_TABLE_REPORTS).select(selectClause).where(whereClause);
    let imageTokens = []

    if (result) {
        result.forEach(function (record) {
            let image_token = record[dbConst.DB_TABLE_REPORTS_IMAGE_TOKEN];

            if (image_token) {
                imageTokens.push(image_token);
            }
        });
    }

    return imageTokens;
}

/**
 * Deletes all reports of a user.
 *
 * @param user The user whose reports should be deleted.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<void>}
 */
ReportDatabaseHandle.prototype.deleteUserReports = async function (user, transaction = this.database.knex) {
    let whereClause = {};
    whereClause[dbConst.DB_TABLE_REPORTS_USER_ID] = user.id;
    await transaction(dbConst.DB_TABLE_REPORTS).where(whereClause).del();
}

module.exports = ReportDatabaseHandle;