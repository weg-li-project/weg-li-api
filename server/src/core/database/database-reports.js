const { Database } = require('./database');
const dbConst = require('./database-const');

/**
 * Database handle class for report-related requests.
 *
 * @author Lukas Trommer
 * @class
 * @param database
 */
function ReportDatabaseHandle(database = Database.shared) {
  this.database = database;
}

/**
 * @author Lukas Trommer
 * @param report {Report}
 * @param transaction
 * @returns {Promise<void>}
 */
ReportDatabaseHandle.prototype.insertReport = async function (
  report,
  transaction = this.database.knex
) {
  const insertData = {};
  insertData[dbConst.DB_TABLE_REPORTS_ID] = report.id;
  insertData[dbConst.DB_TABLE_REPORTS_CREATION] = this.database.knex.raw(
    'CURRENT_TIMESTAMP'
  );

  if (report.user) {
    insertData[dbConst.DB_TABLE_REPORTS_USER_ID] = report.user.id;
  }

  insertData[dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE] = report.violationType;
  insertData[dbConst.DB_TABLE_REPORTS_TIME] = this.database.knex.raw(
    `TO_TIMESTAMP(${report.time})`
  );

  const { latitude } = report.location;
  const { longitude } = report.location;
  insertData[dbConst.DB_TABLE_REPORTS_LOCATION] = this.database.knex.raw(
    `ST_MakePoint(${longitude}, ${latitude})`
  );

  if (report.imageToken) {
    insertData[dbConst.DB_TABLE_REPORTS_IMAGE_TOKEN] = report.imageToken;
  }

  await transaction(dbConst.DB_TABLE_REPORTS).insert(insertData);
};

/**
 * Returns the image tokens that a related to a user's reports.
 *
 * @author Lukas Trommer
 * @param user The user whose related image tokens should be retrieved.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<any[String]>} The string array of image tokens.
 */
ReportDatabaseHandle.prototype.queryUserReportImageTokens = async function (
  user,
  transaction = this.database.knex
) {
  const selectClause = [dbConst.DB_TABLE_REPORTS_IMAGE_TOKEN];

  const whereClause = {};
  whereClause[dbConst.DB_TABLE_REPORTS_USER_ID] = user.id;

  const result = await transaction(dbConst.DB_TABLE_REPORTS)
    .select(selectClause)
    .where(whereClause);
  const imageTokens = [];

  if (result) {
    result.forEach((record) => {
      const imageToken = record[dbConst.DB_TABLE_REPORTS_IMAGE_TOKEN];

      if (imageToken) {
        imageTokens.push(imageToken);
      }
    });
  }

  return imageTokens;
};

/**
 * Deletes all reports of a user.
 *
 * @author Lukas Trommer
 * @param user The user whose reports should be deleted.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<void>}
 */
ReportDatabaseHandle.prototype.deleteUserReports = async function (
  user,
  transaction = this.database.knex
) {
  const whereClause = {};
  whereClause[dbConst.DB_TABLE_REPORTS_USER_ID] = user.id;
  await transaction(dbConst.DB_TABLE_REPORTS).where(whereClause).del();
};

/**
 * Returns records in range of given location.
 *
 * @author Niclas Kühnapfel
 * @param location The center location of ROI.
 * @param radius Maximum distance to points that should be taken into account.
 * @param exclude ID of record that should be excluded.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<Array>} The array of records containing violation type and distance.
 */
ReportDatabaseHandle.prototype.queryNearReports = async function (
  location,
  radius,
  exclude = null,
  transaction = this.database.knex
) {
  const point = `ST_MakePoint(${location.longitude}, ${location.latitude})`;
  const distance = this.database.knex.raw(
    `ST_Distance(location, ${point}) distance`
  );
  const coordinates = this.database.knex.raw(
    'ST_X(location::geometry), ST_Y(location::geometry)'
  );

  const selectClause = [
    dbConst.DB_TABLE_REPORTS_ID,
    dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE,
    distance,
    coordinates,
  ];
  const whereClause = this.database.knex.raw(
    `ST_DWithin(location, ${point}, ${radius})`
  );
  const whereNotClause = {};
  whereNotClause[dbConst.DB_TABLE_REPORTS_ID] = exclude;

  return transaction(dbConst.DB_TABLE_REPORTS)
    .select(selectClause)
    .where(whereClause)
    .whereNot(whereNotClause);
};

/**
 * Returns all reports stored in the databases.
 *
 * @author Niclas Kühnapfel
 * @param transaction
 * @returns {Promise<Array>}
 */
ReportDatabaseHandle.prototype.queryAllReports = async function (
  transaction = this.database.knex
) {
  const coordinates = this.database.knex.raw(
    'ST_X(location::geometry), ST_Y(location::geometry)'
  );
  const selectClause = [
    dbConst.DB_TABLE_REPORTS_ID,
    dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE,
    coordinates,
  ];

  return transaction(dbConst.DB_TABLE_REPORTS).select(selectClause);
};

/**
 * Returns the n most common violation types.
 *
 * @author Niclas Kühnapfel
 * @param n Number of returned values.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<Array>} The array of records containing violation type and count.
 */
ReportDatabaseHandle.prototype.getMostCommonViolations = async function (
  n,
  transaction = this.database.knex
) {
  const whereNotNullClause = dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE;
  const groupClause = dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE;
  const selectClause = dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE;

  const result = await transaction(dbConst.DB_TABLE_REPORTS)
    .select(selectClause)
    .count('* as count')
    .whereNotNull(whereNotNullClause)
    .groupBy(groupClause)
    .orderBy('count', 'desc')
    .limit(n);

  const mostCommon = [];
  if (result) {
    result.forEach((record) => {
      const violation = record[dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE];

      if (violation) {
        mostCommon.push(violation);
      }
    });
  }

  return mostCommon;
};

module.exports = ReportDatabaseHandle;
