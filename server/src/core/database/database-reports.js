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

    insertData[dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE] = report.violationType;
    insertData[dbConst.DB_TABLE_REPORTS_TIME] = this.database.knex.raw("TO_TIMESTAMP(" + report.time + ")");

    let latitude = report.location.latitude;
    let longitude = report.location.longitude;
    insertData[dbConst.DB_TABLE_REPORTS_LOCATION] =
        this.database.knex.raw("ST_MakePoint(" + longitude + ", " + latitude + ")");

    if (report.imageToken) {
        insertData[dbConst.DB_TABLE_REPORTS_IMAGE_TOKEN] = report.imageToken;
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

/**
 * Returns records in range of given location.
 *
 * @param location The center location of ROI.
 * @param radius Maximum distance to points that should be taken into account.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<[Array]>} The array of records containing violation type and distance.
 * @author Niclas Kühnapfel
 */
ReportDatabaseHandle.prototype.queryNearReports = async function (location, radius, transaction = this.database.knex) {
    let point = 'ST_MakePoint(' + location.longitude + ', ' + location.latitude + ')';
    let distance = this.database.knex.raw('ST_Distance(location, ' + point + ') distance');
    let coordinates = this.database.knex.raw('ST_X(location::geometry), ST_Y(location::geometry)')

    let selectClause = [dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE, distance, coordinates];
    let whereClause = this.database.knex.raw('ST_DWithin(location, ' + point + ', ' + radius + ')');

    return transaction(dbConst.DB_TABLE_REPORTS).select(selectClause).where(whereClause);
}

/**
 * Returns the n most common violation types.
 *
 * @param n Number of returned values.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<Array>} The array of records containing violation type and count.
 * @author Niclas Kühnapfel
 */
ReportDatabaseHandle.prototype.getMostCommonViolations = async function (n, transaction = this.database.knex) {
    let whereNotNullClause = dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE;
    let groupClause = dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE;
    let selectClause = dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE;

    return transaction(dbConst.DB_TABLE_REPORTS).select(selectClause).count('* as count')
        .whereNotNull(whereNotNullClause).groupBy(groupClause).orderBy('count', 'desc').limit(n);
}

module.exports = ReportDatabaseHandle;
