const Knex = require("knex");

/**
 *
 * @param user The username.
 * @param password The password.
 * @param database The database name.
 * @constructor
 * @author Lukas Trommer
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
    socketPath: null
}

/**
 * Creates a database configuration for a TCP socket connection.
 *
 * @param user
 * @param password
 * @param database
 * @param host
 * @param port
 * @returns {DatabaseConfiguration}
 * @author Lukas Trommer
 */
DatabaseConfiguration.forTCPSocket = function(user, password, database, host, port) {
    let configuration = new DatabaseConfiguration(user, password, database);
    configuration.host = host;
    configuration.port = port;
    return configuration;
}

/**
 * Creates a database configuration for a Unix socket connection.
 *
 * @param user
 * @param password
 * @param database
 * @param socketPath
 * @returns {DatabaseConfiguration}
 * @author Lukas Trommer
 */
DatabaseConfiguration.forUnixSocket = function (user, password, database, socketPath) {
    let configuration = new DatabaseConfiguration(user, password, database);
    configuration.socketPath = socketPath;
    return configuration;
}

/**
 * Creates a database configuration based on the provided runtime environment variables. If variables for both a
 * TCP socket connection and Unix socket connection are set, the latter will be preferred.
 *
 * @returns {DatabaseConfiguration|null}
 * @author Lukas Trommer
 */
DatabaseConfiguration.fromEnvironment = function () {
    let configuration = new DatabaseConfiguration(process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME);

    if (process.env.DB_SOCKET_PATH) {
        configuration.socketPath = process.env.DB_SOCKET_PATH;
    } else if (process.env.HOST) {
        let tcpSocketAddress = process.env.HOST.split(':');
        configuration.host = tcpSocketAddress[0];
        configuration.port = tcpSocketAddress[1];
    } else {
        return null;
    }

    return configuration;
}

/**
 * Creates a new Database object.
 *
 * @param configuration {DatabaseConfiguration} The DatabaseConfiguration object containing the connection information.
 * @constructor
 * @author Lukas Trommer
 */
function Database(configuration) {
    this.configuration = configuration;
}

Database.prototype = {
    configuration: null,
    knex: null
}

/**
 * The singleton or main database object (to be assigned externally).
 *
 * @type {Database|null}
 */
Database.shared = null;

/**
 * Connects to the database and builds a relating connection pool for future database calls.
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
            port: this.configuration.port
        }
    } else if (this.configuration.socketPath) {
        knexConnectionConfig = {
            user: this.configuration.user,
            password: this.configuration.password,
            database: this.configuration.database,
            host: this.configuration.socketPath
        }
    }

    if (!knexConnectionConfig) {
        // TODO: Handle Knex configuration creation failed
    }

    this.knex = Knex({
        client: "pg",
        connection: knexConnectionConfig
    })
}

/**
 * @returns {*} A new Knex database transaction.
 * @author Lukas Trommer
 */
Database.prototype.newTransaction = function () {
    return this.knex.transaction();
}

module.exports = {
    Database: Database,
    DatabaseConfiguration: DatabaseConfiguration
}