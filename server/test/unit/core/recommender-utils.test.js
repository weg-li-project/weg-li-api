const assert = require('assert');
const Utils = require('../../../src/core/recommender/recommender-utils');

/** @author Niclas Kühnapfel */
describe('Recommender utilities', () => {
  describe('#inverseMultiQuadratic', () => {
    const expected = 0.3688455203054102;
    it('should return positive float with positive parameters', () => {
      assert.strictEqual(Utils.inverseMultiQuadratic(2.1, 1.2), expected);
    });
    it('should return positive float with pos./neg. parameters', () => {
      assert.strictEqual(Utils.inverseMultiQuadratic(-2.1, 1.2), expected);
    });
    it('should return positive float with pos./neg. parameters', () => {
      assert.strictEqual(Utils.inverseMultiQuadratic(2.1, -1.2), expected);
    });
    it('should return positive float with negative parameters', () => {
      assert.strictEqual(Utils.inverseMultiQuadratic(-2.1, -1.2), expected);
    });
  });

  describe('#inverseQuadratic', () => {
    const expected = 0.13604701784936876;
    it('should return positive float with positive parameters', () => {
      assert.strictEqual(Utils.inverseQuadratic(2.1, 1.2), expected);
    });
    it('should return positive float with pos./neg. parameters', () => {
      assert.strictEqual(Utils.inverseQuadratic(-2.1, 1.2), expected);
    });
    it('should return positive float with pos./neg. parameters', () => {
      assert.strictEqual(Utils.inverseQuadratic(2.1, -1.2), expected);
    });
    it('should return positive float with negative parameters', () => {
      assert.strictEqual(Utils.inverseQuadratic(-2.1, -1.2), expected);
    });
  });

  describe('#getSecsMidnight', () => {
    it('should return number of seconds from midnight', () => {
      const date = new Date('2008-08-08T00:00:00+0000');
      assert.strictEqual(Utils.getSecsMidnight(date), 0);
    });
    it('should return number of seconds from midnight', () => {
      const date = new Date('2008-08-08T23:59:59+0000');
      assert.strictEqual(Utils.getSecsMidnight(date), 86399);
    });
    it('should return number of seconds from midnight', () => {
      const date = new Date('3000-10-01T08:10:12+0000');
      assert.strictEqual(Utils.getSecsMidnight(date), 29412);
    });
    it('should return number of seconds from midnight', () => {
      const date = new Date('1700-10-01T08:10:12+0000');
      assert.strictEqual(Utils.getSecsMidnight(date), 29412);
    });
  });
});
