/** SQL table and column name constants to be used within the database methods. */
module.exports = {
  DB_TABLE_USERS: 'users',
  DB_TABLE_USERS_ID: 'id',
  DB_TABLE_USERS_CREATION: 'creation',
  DB_TABLE_STATS: 'statistics',

  DB_TABLE_USER_ACCESS: 'user_access',
  DB_TABLE_USER_ACCESS_USER_ID: 'user_id',
  DB_TABLE_USER_ACCESS_TOKEN: 'access_token',

  DB_TABLE_REPORTS: 'reports',
  DB_TABLE_REPORTS_ID: 'id',
  DB_TABLE_REPORTS_CREATION: 'creation',
  DB_TABLE_REPORTS_USER_ID: 'user_id',
  DB_TABLE_REPORTS_VIOLATION_TYPE: 'violation_type',
  DB_TABLE_REPORTS_TIME: 'time',
  DB_TABLE_REPORTS_SEVERITY_TYPE: 'severity_type',
  DB_TABLE_REPORTS_LOCATION: 'location',
  DB_TABLE_REPORTS_IMAGE_TOKEN: 'image_token',

  DB_TABLE_STATS_VIOLATION_TYPE: 'violation_type',
  DB_TABLE_STATS_VIOLATION_COUNT: 'violation_count',
  DB_TABLE_STATS_SEVERITY_COUNT: 'severity_count',
};
