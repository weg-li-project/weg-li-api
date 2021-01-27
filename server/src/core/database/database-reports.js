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
 * Returns all reports stored in the test reports table of the database.
 *
 * @author Niclas Kühnapfel
 * @param transaction The database transaction in which this request will be performed.
 */
ReportDatabaseHandle.prototype.getTestReports = async function (
  transaction = this.database.knex
) {
  const coordinates = this.database.knex.raw(
    'ST_X(location::geometry), ST_Y(location::geometry)'
  );
  const selectClause = [
    dbConst.DB_TABLE_REPORTS_ID,
    dbConst.DB_TABLE_REPORTS_USER_ID,
    dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE,
    dbConst.DB_TABLE_REPORTS_TIME,
    dbConst.DB_TABLE_REPORTS_SEVERITY,
    coordinates,
  ];

  return transaction(dbConst.DB_TABLE_TEST_REPORTS).select(selectClause);
};

/**
 * Returns the n most common violation types.
 *
 * @author Niclas Kühnapfel
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<Array>} The array of records containing violation type and count.
 */
ReportDatabaseHandle.prototype.getMostCommonViolations = async function (
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
    .orderBy('count', 'desc');

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

/**
 * Returns k nearest neighbors of given location.
 *
 * @author Niclas Kühnapfel
 * @param location The center location of ROI.
 * @param number The number of neighbors to search for.
 * @param maxRadius The maximum distance for search.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<Array>} The neighbors.
 */
ReportDatabaseHandle.prototype.getKNN = async function (
  location,
  number,
  maxRadius,
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
  const orderClause = this.database.knex.raw(`reports.location <-> ${point}`);
  const whereClause = this.database.knex.raw(
    `ST_DWithin(location, ${point}, ${maxRadius})`
  );

  return transaction(dbConst.DB_TABLE_REPORTS)
    .select(selectClause)
    .where(whereClause)
    .orderBy(orderClause)
    .limit(number);
};

/**
 * Counts the number of reports in the area.
 *
 * @author Niclas Kühnapfel
 * @param location The center location of ROI.
 * @param radius Tha radius of ROI.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<Number>} Number of reports in ROI.
 */
ReportDatabaseHandle.prototype.countNearReports = async function (
  location,
  radius,
  transaction = this.database.knex
) {
  const point = `ST_MakePoint(${location.longitude}, ${location.latitude})`;
  const whereClause = this.database.knex.raw(
    `ST_DWithin(location, ${point}, ${radius})`
  );

  return (
    await transaction(dbConst.DB_TABLE_REPORTS).count('*').where(whereClause)
  )[0].count;
};

/**
 * Returns all reports of given user.
 *
 * @param userId The user's identifier.
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<Array>} Reports of given user.
 */
ReportDatabaseHandle.prototype.getAllUserReports = async function (
  userId,
  transaction = this.database.knex
) {
  const selectClause = [
    dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE,
    dbConst.DB_TABLE_REPORTS_TIME,
  ];
  const whereClause = {};
  whereClause[dbConst.DB_TABLE_REPORTS_USER_ID] = userId;

  return transaction(dbConst.DB_TABLE_REPORTS)
    .select(selectClause)
    .where(whereClause)
    .orderBy(dbConst.DB_TABLE_REPORTS_TIME, 'desc');
};

/**
 * Returns most common severity for given violation type.
 *
 * @param transaction The database transaction in which this request will be performed.
 * @returns {Promise<any>} Most common severity identifier.
 */
ReportDatabaseHandle.prototype.getMostCommonSeverities = async function (
  transaction = this.database.knex
) {
  const selectClause = [
    dbConst.DB_TABLE_REPORTS_SEVERITY,
    dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE,
  ];

  const records = await transaction(dbConst.DB_TABLE_REPORTS)
    .select(selectClause)
    .count(dbConst.DB_TABLE_REPORTS_SEVERITY)
    .groupBy(selectClause)
    .orderBy(dbConst.DB_TABLE_REPORTS_VIOLATION_TYPE);

  const mostCommon = {};
  records.forEach((o) => {
    if (o.violation_type in mostCommon) {
      if (mostCommon[o.violation_type].count < parseInt(o.count)) {
        mostCommon[o.violation_type].severity = o.severity;
        mostCommon[o.violation_type].count = parseInt(o.count);
      }
    } else {
      mostCommon[o.violation_type] = {};
      mostCommon[o.violation_type].severity = o.severity;
      mostCommon[o.violation_type].count = parseInt(o.count);
    }
  });

  return mostCommon;
};

module.exports = ReportDatabaseHandle;
