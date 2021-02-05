const assert = require('assert');
const rewireMock = require('rewiremock/node');
const Location = require('../../../src/models/location');

/** @author Niclas Kühnapfel */
describe('Recommender core', () => {
  let MockedCore;
  class ReportDatabaseHandle {}
  before(() => {
    rewireMock('../../../src/core/database/database-reports.js').with(
      ReportDatabaseHandle
    );
    rewireMock.enable();

    // eslint-disable-next-line global-require
    MockedCore = require('../../../src/core/recommender/recommender-core');
  });

  after(() => {
    rewireMock.disable();
  });

  describe('#getRecommendations', () => {
    it('should suggest violation type 2', async () => {
      const core = new MockedCore();

      // most common violation type is 2
      ReportDatabaseHandle.prototype.getMostCommonViolations = async () => new Promise((resolve) => {
        resolve([
          { violation_type: 2 },
          { violation_type: 0 },
          { violation_type: 10 },
          { violation_type: 5 },
        ]);
      });

      // nearest violation type by time in user history is 2
      ReportDatabaseHandle.prototype.getAllUserReports = async () => new Promise((resolve) => {
        resolve([
          { violation_type: 1, time: '2021-11-15T01:37:00.000Z' },
          { violation_type: 2, time: '2009-07-28T12:37:00.000Z' },
          { violation_type: 3, time: '2013-03-01T18:37:00.000Z' },
          { violation_type: 4, time: '2010-01-11T01:00:00.000Z' },
        ]);
      });
      const unixTime = 1601899200;

      // nearest violation type by distance is 2
      ReportDatabaseHandle.prototype.countNearReports = async () => new Promise((resolve) => {
        resolve(0);
      });
      ReportDatabaseHandle.prototype.getKNN = async () => new Promise((resolve) => {
        resolve([
          { violation_type: 2, distance: 10 },
          { violation_type: 1, distance: 50 },
          { violation_type: 2, distance: 100 },
        ]);
      });
      const loc = new Location(52.512852, 13.326802);

      // most common severity for violation type is 2
      ReportDatabaseHandle.prototype.getMostCommonSeverities = async () => new Promise((resolve) => {
        resolve([0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2]);
      });

      // therefore should return 2
      const result = await core.getRecommendations(loc, 1, unixTime);
      assert.strictEqual(result[0].violation_type, 2);
      assert.strictEqual(result[0].severity, 2);
    });

    it('should suggest violation type 5', async () => {
      const core = new MockedCore();

      // most common violation type is 2
      ReportDatabaseHandle.prototype.getMostCommonViolations = async () => new Promise((resolve) => {
        resolve([
          { violation_type: 5 },
          { violation_type: 0 },
          { violation_type: 10 },
          { violation_type: 5 },
        ]);
      });

      // nearest violation type by distance is 2
      ReportDatabaseHandle.prototype.countNearReports = async () => new Promise((resolve) => {
        resolve(0);
      });
      ReportDatabaseHandle.prototype.getKNN = async () => new Promise((resolve) => {
        resolve([
          { violation_type: 5, distance: 10 },
          { violation_type: 1, distance: 50 },
          { violation_type: 2, distance: 100 },
        ]);
      });
      const loc = new Location(52.512852, 13.326802);

      // most common severity for violation type is 2
      ReportDatabaseHandle.prototype.getMostCommonSeverities = async () => new Promise((resolve) => {
        resolve([0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2]);
      });

      // therefore should return 2
      const result = await core.getRecommendations(loc);
      assert.strictEqual(result[0].violation_type, 5);
      assert.strictEqual(result[0].severity, 2);
    });
  });

  describe('#computeMostCommonScores', () => {
    it('should return empty list', async () => {
      const core = new MockedCore();
      ReportDatabaseHandle.prototype.getMostCommonViolations = async () => new Promise((resolve) => {
        resolve([]);
      });
      assert.deepStrictEqual(await core.computeMostCommonScores(), []);
    });

    it(
      'should return list of scores where index equals violation type'
        + ' and where the sum of all scores equals 1',
      async () => {
        const core = new MockedCore();
        ReportDatabaseHandle.prototype.getMostCommonViolations = async () => new Promise((resolve) => {
          resolve([
            { violation_type: 0 },
            { violation_type: 2 },
            { violation_type: 10 },
            { violation_type: 5 },
          ]);
        });
        const expected = [];
        expected[0] = 0.4;
        expected[2] = 0.3;
        expected[5] = 0.1;
        expected[10] = 0.2;
        assert.deepStrictEqual(await core.computeMostCommonScores(), expected);
      }
    );
  });

  describe('#computeUserHistoryScores', () => {
    it('should return empty list', async () => {
      const core = new MockedCore();
      ReportDatabaseHandle.prototype.getAllUserReports = async () => new Promise((resolve) => {
        resolve([]);
      });
      assert.deepStrictEqual(await core.computeUserHistoryScores(1, 0), []);
    });

    it('should suggest violation type 2 and sum of scores  should be close to 1', async () => {
      const core = new MockedCore();
      ReportDatabaseHandle.prototype.getAllUserReports = async () => new Promise((resolve) => {
        resolve([
          { violation_type: 1, time: '2021-11-15T01:37:00.000Z' },
          { violation_type: 2, time: '2009-07-28T12:37:00.000Z' },
          { violation_type: 3, time: '2013-03-01T18:37:00.000Z' },
          { violation_type: 4, time: '2010-01-11T01:00:00.000Z' },
        ]);
      });
      const unixTime = 1601899200; // 05.10.2020 12:00:00 UTC

      const result = await core.computeUserHistoryScores(1, unixTime);
      const highestVal = result.reduce((o, n) => (o > n ? o : n), 0);
      const highestInd = result.indexOf(highestVal);
      const sum = result.reduce((a, b) => a + b, 0);

      assert.strictEqual(highestInd, 2);
      if (Math.abs(sum - 1) > 0.001) {
        assert.strictEqual(sum, 1);
      }
    });

    it('should suggest violation type 3 and sum of scores should be close to 1', async () => {
      const core = new MockedCore();
      ReportDatabaseHandle.prototype.getAllUserReports = async () => new Promise((resolve) => {
        resolve([
          { violation_type: 1, time: '2021-11-15T01:37:00.000Z' },
          { violation_type: 2, time: '2009-07-28T12:37:00.000Z' },
          { violation_type: 3, time: '2013-03-01T12:38:00.000Z' },
          { violation_type: 3, time: '2015-07-09T12:38:00.000Z' },
          { violation_type: 3, time: '2012-10-10T12:38:00.000Z' },
          { violation_type: 4, time: '2010-01-11T01:00:00.000Z' },
        ]);
      });
      const unixTime = 1601899200; // 05.10.2020 12:00:00 UTC

      const result = await core.computeUserHistoryScores(1, unixTime);
      const highestVal = result.reduce((o, n) => (o > n ? o : n), 0);
      const sum = result.reduce((a, b) => a + b, 0);

      assert.strictEqual(result.indexOf(highestVal), 3);
      if (Math.abs(sum - 1) > 0.001) {
        assert.strictEqual(sum, 1);
      }
    });
  });

  describe('#computeLocationScores', () => {
    it('should return empty list', async () => {
      const core = new MockedCore();
      ReportDatabaseHandle.prototype.countNearReports = async () => new Promise((resolve) => {
        resolve(0);
      });
      ReportDatabaseHandle.prototype.getKNN = async () => new Promise((resolve) => {
        resolve([]);
      });
      const loc = new Location(10, 10);
      assert.deepStrictEqual(await core.computeLocationScores(loc), []);
    });

    it('should suggest violation type 4 and sum of scores should be close to 1', async () => {
      const core = new MockedCore();
      ReportDatabaseHandle.prototype.countNearReports = async () => new Promise((resolve) => {
        resolve(0);
      });
      ReportDatabaseHandle.prototype.getKNN = async () => new Promise((resolve) => {
        resolve([
          { violation_type: 4, distance: 10 },
          { violation_type: 1, distance: 50 },
          { violation_type: 2, distance: 100 },
        ]);
      });
      const loc = new Location(52.512852, 13.326802);

      const result = await core.computeLocationScores(loc);
      const highestVal = result.reduce((o, n) => (o > n ? o : n), 0);
      const sum = result.reduce((a, b) => a + b, 0);

      assert.strictEqual(result.indexOf(highestVal), 4);
      if (Math.abs(sum - 1) > 0.001) {
        assert.strictEqual(sum, 1);
      }
    });

    it('should suggest violation type 1 and sum of scores should be close to 1', async () => {
      const core = new MockedCore();
      ReportDatabaseHandle.prototype.countNearReports = async () => new Promise((resolve) => {
        resolve(0);
      });
      ReportDatabaseHandle.prototype.getKNN = async () => new Promise((resolve) => {
        resolve([
          { violation_type: 0, distance: 10 },
          { violation_type: 1, distance: 12 },
          { violation_type: 1, distance: 12 },
          { violation_type: 1, distance: 12 },
          { violation_type: 2, distance: 100 },
        ]);
      });
      const loc = new Location(52.512852, 13.326802);

      const result = await core.computeLocationScores(loc);
      const highestVal = result.reduce((o, n) => (o > n ? o : n), 0);
      const sum = result.reduce((a, b) => a + b, 0);

      assert.strictEqual(result.indexOf(highestVal), 1);
      if (Math.abs(sum - 1) > 0.001) {
        assert.strictEqual(sum, 1);
      }
    });
  });

  describe('#sumUpWeights', () => {
    it('should return empty list', async () => {
      const core = new MockedCore();
      assert.deepStrictEqual(core.constructor.sumUpWeights([], 0), []);
    });

    it(
      'should return array with normalized scores and where index '
        + 'equals violation type',
      async () => {
        const core = new MockedCore();
        const data = [
          { violation_type: 0, weight: 1 },
          { violation_type: 2, weight: -1 },
          { violation_type: 3, weight: 0.1 },
        ];
        const expected = [];
        expected[0] = 0.5;
        expected[2] = -0.5;
        expected[3] = 0.05;
        assert.deepStrictEqual(
          core.constructor.sumUpWeights(data, 2),
          expected
        );
      }
    );
  });
});
