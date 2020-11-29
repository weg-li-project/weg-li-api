const { Database } = require("./database")
const dbConst = require("./database-const")
const Report = require("../../models/report")

/**
 * Database handle class for report-related requests.
 *
 * @param database
 * @constructor
 * @author Lukas Trommer
 */
function ReportDatabaseHandle(database = Database.shared) {
    this.database = database;
}

/**
 *
 * @param report {Report}
 * @param transaction
 * @returns {Promise<void>}
 * @author Lukas Trommer
 */
ReportDatabaseHandle.prototype.insertReport = async function (report, transaction = this.database.knex) {
    let insertData = {};
    insertData[dbConst.DB_TABLE_REPORTS_ID] = report.id;
    insertData[dbConst.DB_TABLE_REPORTS_CREATION] = this.database.knex.raw("CURRENT_TIMESTAMP");

    if (report.user) {
        insertData[dbConst.DB_TABLE_REPORTS_USER_ID] = report.user.id;
    }

    insertData[dbConst.DB_TABLE_REPORTS_TIME] = report.time;

    let latitude = report.location.latitude;
    let longitude = report.location.longitude;
    insertData[dbConst.DB_TABLE_REPORTS_LOCATION] =
        this.database.knex.raw("ST_MakePoint(" + longitude + ", " + latitude + ")");

    if (report.image_token) {
        insertData[dbConst.DB_TABLE_REPORTS_IMAGE_TOKEN] = report.image_token;
    }

    await transaction(dbConst.DB_TABLE_REPORTS).insert(insertData);
}

/**
 * Returns the image tokens that a related to a user's reports.
 *
 * @param user The user whose related image tokens should be retrieved.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<*[String]>} The string array of image tokens.
 * @author Lukas Trommer
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
 * @author Lukas Trommer
 */
ReportDatabaseHandle.prototype.deleteUserReports = async function (user, transaction = this.database.knex) {
    let whereClause = {};
    whereClause[dbConst.DB_TABLE_REPORTS_USER_ID] = user.id;
    await transaction(dbConst.DB_TABLE_REPORTS).where(whereClause).del();
}

module.exports = ReportDatabaseHandle;