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
 * @param exclude ID of record that should be excluded.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<Array>} The array of records containing violation type and distance.
 * @author Niclas Kühnapfel
 */
/**
ReportDatabaseHandle.prototype.queryNearReports = async function (location, radius, exclude = null, transaction = this.database.knex) {
    let point = 'ST_MakePoint(' + location.longitude + ', ' + location.latitude + ')';
    let distance = this.database.knex.raw('ST_Distance(location, ' + point + ') distance');
    let coordinates = this.database.knex.raw('ST_X(location::geometry), ST_Y(location::geometry)')

    let selectClause = [dbConst.DB_TABLE_REPORTS_ID, dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE, distance, coordinates];
    let whereClause = this.database.knex.raw('ST_DWithin(location, ' + point + ', ' + radius + ')');
    let whereNotClause = {};
    whereNotClause[dbConst.DB_TABLE_REPORTS_ID] = exclude;

    return transaction(dbConst.DB_TABLE_REPORTS).select(selectClause).where(whereClause).whereNot(whereNotClause);
}
 **/

/**
 * Returns all reports stored in the test reports table of the database.
 *
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<Array>}
 * @author Niclas Kühnapfel
 */
ReportDatabaseHandle.prototype.getTestReports = async function (transaction = this.database.knex) {
    let coordinates = this.database.knex.raw('ST_X(location::geometry), ST_Y(location::geometry)')
    let selectClause = [dbConst.DB_TABLE_REPORTS_ID, dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE, coordinates];

    return transaction(dbConst.DB_TABLE_TEST_REPORTS).select(selectClause);
}

/**
 * Returns the n most common violation types.
 *
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<Array>} The array of records containing violation type and count.
 * @author Niclas Kühnapfel
 */
ReportDatabaseHandle.prototype.getMostCommonViolations = async function (transaction = this.database.knex) {
    let whereNotNullClause = dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE;
    let groupClause = dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE;
    let selectClause = dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE;

    let result = await transaction(dbConst.DB_TABLE_REPORTS).select(selectClause).count('* as count')
        .whereNotNull(whereNotNullClause).groupBy(groupClause).orderBy('count', 'desc');

    let mostCommon = [];
    if (result) {
        result.forEach(function (record) {
            let violation = record[dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE];

            if (violation) {
                mostCommon.push(violation);
            }
        });
    }

    return mostCommon;
}

/**
 * Returns k nearest neighbors of given location.
 *
 * @param location The center location of ROI.
 * @param number The number of neighbors to search for.
 * @param maxRadius The maximum distance for search.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<Array>} The neighbors.
 * @author Niclas Kühnapfel
 */
ReportDatabaseHandle.prototype.getKNN = async function (location, number, maxRadius, transaction = this.database.knex) {
    let point = 'ST_MakePoint(' + location.longitude + ', ' + location.latitude + ')';
    let distance = this.database.knex.raw('ST_Distance(location, ' + point + ') distance');
    let coordinates = this.database.knex.raw('ST_X(location::geometry), ST_Y(location::geometry)')

    let selectClause = [dbConst.DB_TABLE_REPORTS_ID, dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE, distance, coordinates];
    let orderClause = this.database.knex.raw('reports.location <-> ' + point);
    let whereClause = this.database.knex.raw('ST_DWithin(location, ' + point + ', ' + maxRadius + ')');

    return transaction(dbConst.DB_TABLE_REPORTS).select(selectClause).where(whereClause).orderBy(orderClause).limit(number);
}

/**
 * Counts the number of reports in the area.
 *
 * @param location The center location of ROI.
 * @param radius Tha radius of ROI.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<Number>} Number of reports in ROI.
 * @author Niclas Kühnapfel
 */
ReportDatabaseHandle.prototype.countNearReports = async function (location, radius, transaction = this.database.knex) {
    let point = 'ST_MakePoint(' + location.longitude + ', ' + location.latitude + ')';
    let whereClause = this.database.knex.raw('ST_DWithin(location, ' + point + ', ' + radius + ')');
    return transaction(dbConst.DB_TABLE_REPORTS).count('*').where(whereClause);
}

module.exports = ReportDatabaseHandle;
