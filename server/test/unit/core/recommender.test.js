const Bluebird = require('bluebird');

const Recommender = require('../../../src/core/recommender');
const ReportDatabaseHandle = require('../../../src/core/database/database-reports');
const Location = require('../../../src/models/location');
const {
  Database,
  DatabaseConfiguration,
} = require('../../../src/core/database/database');

function initDatabase() {
  const configuration = DatabaseConfiguration.forTCPSocket(
    'postgres',
    'postgres',
    'wegli_user_random',
    'localhost',
    '5432'
  );
  const database = new Database(configuration);
  database.connect();
  Database.shared = database;
}

async function analyzeData(reports) {
  const recommender = new Recommender();
  const matches = new Array(44).fill(0);
  let counter = 0;

  // check for each data point
  await Bluebird.map(
    reports,
    async (report) => {
      const location = new Location(report.st_y, report.st_x);
      const type = report.violation_type;

      const recommendations = await recommender.getRecommendations(
        location,
        report.user_id
      );

      if (recommendations.includes(type)) {
        matches[recommendations.indexOf(type)] += 1;
      }

      counter += 1;
    },
    { concurrency: 2500 }
  );

  return [counter, matches];
}

function printResults(counter, matches) {
  matches.forEach(function (item, index) {
    this[index] = (100 / counter) * item;
  }, matches);

  console.log(`Analyzed ${counter} data points.`);
  for (let i = 0; i < 10; i += 1) {
    console.log(
      `${(i + 1).toString()}. recommendation accuracy: ${matches[i].toFixed(
        2
      )} %`
    );
  }

  const sum = matches[0] + matches[1] + matches[2];
  const sumFive = sum + matches[3] + matches[4];
  const sumTen = sumFive + matches[5] + matches[6] + matches[7] + matches[8] + matches[9];

  console.log(`3 recommendations accuracy: ${sum.toFixed(2)} %`);
  console.log(`5 recommendations accuracy: ${sumFive.toFixed(2)} %`);
  console.log(`10 recommendations accuracy: ${sumTen.toFixed(2)} %`);
}

describe('Recommender', () => {
  describe('#getLocationRecommendations', () => {
    it('shows overall accuracy', async () => {
      initDatabase();
      const dbHandle = new ReportDatabaseHandle();
      const testReports = await dbHandle.getTestReports();

      const analyzed = await analyzeData(testReports);

      console.log('Overall Accuracy:');
      printResults(analyzed[0], analyzed[1]);
    }).timeout(0);
  });
});
