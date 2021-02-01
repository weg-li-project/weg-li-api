const Knex = require('knex');

/**
 * @author Lukas Trommer
 * @class
 * @param user The username.
 * @param password The password.
 * @param database The database name.
 */
function DatabaseConfiguration(user, password, database) {
  this.user = user;
  this.password = password;
  this.database = database;
}

DatabaseConfiguration.prototype = {
  user: null,
  password: null,
  database: null,
  host: null,
  port: null,
  socketPath: null,
};

/**
 * Creates a database configuration for a TCP socket connection.
 *
 * @author Lukas Trommer
 * @param user
 * @param password
 * @param database
 * @param host
 * @param port
 * @returns {DatabaseConfiguration}
 */
DatabaseConfiguration.forTCPSocket = function (
  user,
  password,
  database,
  host,
  port
) {
  const configuration = new DatabaseConfiguration(user, password, database);
  configuration.host = host;
  configuration.port = port;
  return configuration;
};

/**
 * Creates a database configuration for a Unix socket connection.
 *
 * @author Lukas Trommer
 * @param user
 * @param password
 * @param database
 * @param socketPath
 * @returns {DatabaseConfiguration}
 */
DatabaseConfiguration.forUnixSocket = function (
  user,
  password,
  database,
  socketPath
) {
  const configuration = new DatabaseConfiguration(user, password, database);
  configuration.socketPath = socketPath;
  return configuration;
};

/**
 * Creates a database configuration based on the provided runtime environment
 * variables. If variables for both a TCP socket connection and Unix socket
 * connection are set, the latter will be preferred.
 *
 * @author Lukas Trommer
 * @returns {DatabaseConfiguration | null}
 */
DatabaseConfiguration.fromEnvironment = function () {
  const configuration = new DatabaseConfiguration(
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    process.env.DB_NAME
  );

  if (process.env.DB_SOCKET_PATH) {
    configuration.socketPath = process.env.DB_SOCKET_PATH;
  } else if (process.env.HOST) {
    const tcpSocketAddress = process.env.HOST.split(':');

    if (tcpSocketAddress.length === 1) {
      [configuration.host] = tcpSocketAddress;
    } else if (tcpSocketAddress.length === 2) {
      [configuration.host, configuration.port] = tcpSocketAddress;
    } else {
      return null;
    }
  } else {
    return null;
  }

  return configuration;
};

/**
 * Creates a new Database object.
 *
 * @author Lukas Trommer
 * @class
 * @param configuration {DatabaseConfiguration} The DatabaseConfiguration object
 *     containing the connection information.
 */
function Database(configuration) {
  this.configuration = configuration;
}

Database.prototype = {
  configuration: null,
  knex: null,
};

/**
 * The singleton or main database object (to be assigned externally).
 *
 * @type {Database | null}
 */
Database.shared = null;

/**
 * Connects to the database and builds a relating connection pool for future
 * database calls.
 *
 * @author Lukas Trommer
 */
Database.prototype.connect = function () {
  let knexConnectionConfig;

  if (this.configuration.host && this.configuration.port) {
    knexConnectionConfig = {
      user: this.configuration.user,
      password: this.configuration.password,
      database: this.configuration.database,
      host: this.configuration.host,
      port: this.configuration.port,
    };
  } else if (this.configuration.socketPath) {
    knexConnectionConfig = {
      user: this.configuration.user,
      password: this.configuration.password,
      database: this.configuration.database,
      host: this.configuration.socketPath,
    };
  }

  if (!knexConnectionConfig) {
    // TODO: Handle Knex configuration creation failed
  }

  this.knex = Knex({
    client: 'pg',
    connection: knexConnectionConfig,
  });
};

/**
 * @author Lukas Trommer
 * @returns {any} A new Knex database transaction.
 */
Database.prototype.newTransaction = function () {
  return this.knex.transaction();
};

module.exports = {
  Database,
  DatabaseConfiguration,
};
