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
// eslint-disable-next-line func-names
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

  if (report.severityType !== undefined) {
    insertData[dbConst.DB_TABLE_REPORTS_SEVERITY_TYPE] = report.severityType;
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
// eslint-disable-next-line func-names
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
// eslint-disable-next-line func-names
ReportDatabaseHandle.prototype.deleteUserReports = async function (
  user,
  transaction = this.database.knex
) {
  const whereClause = {};
  whereClause[dbConst.DB_TABLE_REPORTS_USER_ID] = user.id;
  await transaction(dbConst.DB_TABLE_REPORTS).where(whereClause).del();
};

/**
 * Returns the n most common violation types.
 *
 * @author Niclas Kühnapfel
 * @param transaction - The database transaction in which this request will be
 *     performed.
 * @returns {Array} - The array of records containing violation type and count.
 */
// eslint-disable-next-line func-names
ReportDatabaseHandle.prototype.getMostCommonViolations = async function (
  transaction = this.database.knex
) {
  return transaction(dbConst.DB_TABLE_STATS)
    .select(dbConst.DB_TABLE_STATS_VIOLATION_TYPE)
    .orderBy(dbConst.DB_TABLE_STATS_VIOLATION_COUNT, 'desc');
};

/**
 * Returns k nearest neighbors of given location.
 *
 * @author Niclas Kühnapfel
 * @param location - The center location of ROI.
 * @param number - The number of neighbors to search for.
 * @param maxRadius - The maximum distance for search.
 * @param transaction - The database transaction in which this request will be
 *     performed.
 * @returns {Promise<Array>} - The neighbors.
 */
// eslint-disable-next-line func-names
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
 * @param location - The center location of ROI.
 * @param radius - The radius of ROI.
 * @param transaction - The database transaction in which this request will be
 *     performed.
 * @returns {Promise<Number>} - Number of reports in ROI.
 */
// eslint-disable-next-line func-names
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
 * @author Niclas Kühnapfel
 * @param userId - The user's identifier.
 * @param transaction - The database transaction in which this request will be
 *     performed.
 * @returns {Promise<Array>} - Reports of given user.
 */
// eslint-disable-next-line func-names
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
 * @author Niclas Kühnapfel
 * @param transaction - The database transaction in which this request will be
 *     performed.
 * @returns {Promise<any>} - Most common severity identifier.
 */
// eslint-disable-next-line func-names
ReportDatabaseHandle.prototype.getMostCommonSeverities = async function (
  transaction = this.database.knex
) {
  const subQuery = this.database.knex.raw(
    '(SELECT array_position(severity_count, max(x)) as severity_type FROM unnest(severity_count) as x)'
  );
  const selectClause = [dbConst.DB_TABLE_STATS_VIOLATION_TYPE, subQuery];

  const records = await transaction(dbConst.DB_TABLE_STATS).select(
    selectClause
  );

  const mostCommon = [];
  records.forEach((record) => {
    mostCommon[record.violation_type] = record.severity_type;
  });

  return mostCommon;
};

module.exports = ReportDatabaseHandle;
