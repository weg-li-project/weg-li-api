const Bluebird = require('bluebird');
const mLog = require('mocha-logger');
const rewireMock = require('rewiremock/node');
const ReportDatabaseHandle = require('../../../src/core/database/database-reports');
const Location = require('../../../src/models/location');
const dbConst = require('../../../src/core/database/database-const');
const {
  Database,
  DatabaseConfiguration,
} = require('../../../src/core/database/database');
const RecommenderCore = require('../../../src/core/recommender/recommender-core');

const DB_TABLE_TEST_REPORTS = 'reports_test';

// mocked recommender
let Recommender;

/**
 * Returns all reports stored in the test reports table of the database.
 *
 * @author Niclas Kühnapfel
 * @param transaction The database transaction in which this request will be
 *     performed.
 */
// eslint-disable-next-line func-names
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
    dbConst.DB_TABLE_REPORTS_SEVERITY_TYPE,
    coordinates,
  ];
  return transaction(DB_TABLE_TEST_REPORTS).select(selectClause);
};

/**
 * Accuracy Test helper class
 *
 * @author Niclas Kühnapfel
 */
class AccuracyTest {
  constructor() {
    this.recommender = new Recommender();
    this.violationMatches = new Array(10).fill(0);
    this.severityMatches = 0;
    this.severityCounter = 0;
    this.violationCounter = 0;
  }

  /**
   * Evaluates recommendations for each report.
   *
   * @author Niclas Kühnapfel
   * @param reports 'new' reports
   * @returns {Promise<void>}
   */
  async analyzeData(reports) {
    // check for each data point
    await Bluebird.map(
      reports,
      async (report) => {
        const location = new Location(report.st_y, report.st_x);
        const type = report.violation_type;
        const severity = report.severity_type;
        const recommendations = await this.recommender.getRecommendations(
          location,
          report.user_id,
          report.time
        );

        for (let i = 0; i < 10; i += 1) {
          if (type === recommendations[i].violation_type) {
            this.violationMatches[i] += 1;
            this.severityCounter += 1;
            if (severity === recommendations[i].severity) {
              this.severityMatches += 1;
            }
          }
        }
        this.violationCounter += 1;
      },
      { concurrency: 100 }
    );
  }

  /**
   * Prints results in mocha style.
   *
   * @author Niclas Kühnapfel
   */
  print() {
    const counter = this.violationCounter;
    const matches = this.violationMatches;
    // eslint-disable-next-line func-names
    matches.forEach(function (item, index) {
      this[index] = (100 * item) / counter;
    }, matches);

    mLog.log(`Analyzed ${counter} test reports.`);
    for (let i = 0; i < 10; i += 1) {
      mLog.success(
        `${(i + 1).toString()}. Recommendation Accuracy: ${matches[i].toFixed(
          2
        )} %`
      );
    }

    const sum = matches.reduce((a, b, i) => (i < 3 ? a + b : a), 0);
    const sumFive = matches.reduce((a, b, i) => (i < 5 ? a + b : a), 0);
    const sumTen = matches.reduce((a, b, i) => (i < 10 ? a + b : a), 0);
    mLog.success(`3 Recommendations Accuracy: ${sum.toFixed(2)} %`);
    mLog.success(`5 Recommendations Accuracy: ${sumFive.toFixed(2)} %`);
    mLog.success(`10 Recommendations Accuracy: ${sumTen.toFixed(2)} %`);
    mLog.success(
      `Severity Accuracy: ${
        (100 / this.severityCounter) * this.severityMatches
      } %`
    );
  }
}

/**
 * Violation/severity recommender accuracy test. Provide database environment
 * variables if you want to run these tests with 'npm test'. Your test database
 * should contain a 'reports_test' table filled with 'new' reports. Run with:
 * DB_USER=u DB_PASSWORD=p HOST=host:5432 DB_NAME=weg_li npm test
 *
 * @author Niclas Kühnapfel
 */
describe('Violation/Severity Recommender Accuracy', () => {
  let testReports = [];
  // eslint-disable-next-line func-names
  const MockRec = function () {};

  // eslint-disable-next-line func-names
  before(async function () {
    if (process.env.DB_NAME !== '_') {
      // init db connection
      const databaseConfig = DatabaseConfiguration.fromEnvironment();
      const database = new Database(databaseConfig);
      database.connect();
      Database.shared = database;
      const dbHandle = new ReportDatabaseHandle();
      testReports = await dbHandle.getTestReports();

      rewireMock('../../../src/core/recommender/recommender-core').with(
        MockRec
      );
      rewireMock.enable();

      // eslint-disable-next-line global-require
      Recommender = require('../../../src/core/recommender/recommender-core');
      MockRec.prototype.dbHandle = new ReportDatabaseHandle();
      MockRec.sumUpWeights = RecommenderCore.sumUpWeights;
      MockRec.prototype.getRecommendations = RecommenderCore.prototype.getRecommendations;
    } else {
      // skip if no db env vars are provided
      this.skip();
    }
  });

  after(() => {
    if (process.env.DB_NAME !== '_') {
      Database.shared.knex.destroy();
      rewireMock.disable();
    }
  });

  describe('Combined Accuracy', () => {
    before(() => {
      MockRec.prototype.computeMostCommonScores = RecommenderCore.prototype.computeMostCommonScores;
      MockRec.prototype.computeUserHistoryScores = RecommenderCore.prototype.computeUserHistoryScores;
      MockRec.prototype.computeLocationScores = RecommenderCore.prototype.computeLocationScores;
    });

    it('combined', async () => {
      const test = new AccuracyTest();
      await test.analyzeData(testReports);
      test.print();
    }).timeout(0);
  });

  describe('Most Common Type Based Accuracy', () => {
    before(() => {
      MockRec.prototype.computeMostCommonScores = RecommenderCore.prototype.computeMostCommonScores;
      MockRec.prototype.computeUserHistoryScores = () => [];
      MockRec.prototype.computeLocationScores = () => [];
    });

    it('only based on most common types', async () => {
      const test = new AccuracyTest();
      await test.analyzeData(testReports);
      test.print();
    }).timeout(0);
  });

  describe('User History Based Accuracy', () => {
    before(() => {
      MockRec.prototype.computeMostCommonScores = () => [];
      MockRec.prototype.computeUserHistoryScores = RecommenderCore.prototype.computeUserHistoryScores;
      MockRec.prototype.computeLocationScores = () => [];
    });

    it('only based on user history', async () => {
      const test = new AccuracyTest();
      await test.analyzeData(testReports);
      test.print();
    }).timeout(0);
  });

  describe('Location Based Accuracy', () => {
    before(() => {
      MockRec.prototype.computeMostCommonScores = () => [];
      MockRec.prototype.computeUserHistoryScores = () => [];
      MockRec.prototype.computeLocationScores = RecommenderCore.prototype.computeLocationScores;
    });

    it('only based on location', async () => {
      const test = new AccuracyTest();
      await test.analyzeData(testReports);
      test.print();
    }).timeout(0);
  });
});
