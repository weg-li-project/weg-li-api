const assert = require('assert');
const RecommenderList = require('../../../src/core/recommender/recommender-list');

/** @author Niclas Kühnapfel */
describe('Recommender list', () => {
  describe('#getIndex', () => {
    const lst = new RecommenderList();

    it('should return zero because the list is empty', () => {
      assert.strictEqual(lst.getIndex(0), 0);
    });

    it('should return zero because the list now contains violation 0', () => {
      assert.strictEqual(lst.getIndex(0), 0);
    });

    it('should return one because it is a new type', () => {
      assert.strictEqual(lst.getIndex(1), 1);
    });
  });

  describe('#addScores', () => {
    let lst;

    beforeEach(() => {
      lst = new RecommenderList();
      lst.getLst = function getLst() {
        return this.lst;
      };
    });

    it('should return empty list', () => {
      lst.addScores([], 1);
      assert.deepStrictEqual(lst.getLst(), []);
    });

    it('should return unsorted list of objects', () => {
      const expected = [
        { violation_type: 0, score: 10, severity: 0 },
        { violation_type: 1, score: 0.001, severity: 0 },
      ];
      lst.addScores([10, 0.001], 1);
      assert.deepStrictEqual(lst.getLst(), expected);
    });

    it('should only return a list with objects defined in the array', () => {
      const expected = [
        { violation_type: 0, score: 1, severity: 0 },
        { violation_type: 2, score: 0, severity: 0 },
        { violation_type: 3, score: 3, severity: 0 },
      ];
      const input = [1, undefined, 0, 3, null];
      lst.addScores(input, 1);
      assert.deepStrictEqual(lst.getLst(), expected);
    });
  });

  describe('#sort', () => {
    let lst;

    beforeEach(() => {
      lst = new RecommenderList();
    });

    it('should return empty list', () => {
      assert.deepStrictEqual(lst.sort(), []);
    });

    it('should return list sorted by score of items', () => {
      const expected = [
        { violation_type: 2, score: 11, severity: 0 },
        { violation_type: 0, score: 10, severity: 0 },
        { violation_type: 1, score: 0.001, severity: 0 },
        { violation_type: 5, score: 0, severity: 0 },
        { violation_type: 3, score: -1, severity: 0 },
        { violation_type: 4, score: -2, severity: 0 },
      ];
      lst.addScores([10, 0.001, 11, -1, -2, 0], 1);
      assert.deepStrictEqual(lst.sort(), expected);
    });
  });

  describe('#appendSeverity', () => {
    let lst;

    beforeEach(() => {
      lst = new RecommenderList();
      lst.getLst = function getLst() {
        return this.lst;
      };
    });

    it('should return empty list', () => {
      lst.appendSeverity([]);
      assert.deepStrictEqual(lst.getLst(), []);
    });

    it('should return list with given severities', () => {
      const expected = [
        { violation_type: 0, score: 0, severity: 1 },
        { violation_type: 2, score: 0, severity: 0 },
        { violation_type: 3, score: 0, severity: 3 },
      ];
      lst.appendSeverity([1, undefined, 0, 3, null]);
      assert.deepStrictEqual(lst.getLst(), expected);
    });
  });
});
