const assert = require('assert');
const Location = require('../../../src/models/location');

/** @author Lukas Trommer */
describe('Location', () => {
  describe('#construtor', () => {
    it('should throw error when initialized with values out of range', () => {
      assert.throws(() => new Location(91.013, -280.9083));
    });

    it('should throw error when initialized with undefined values', () => {
      assert.throws(() => new Location(undefined, undefined));
    });
  });

  describe('#isLatitude', () => {
    it('should return true when called with valid value', () => {
      assert.strictEqual(Location.isLatitude(45.133), true);
    });

    it('should return false when called with value out of range (lower bound)', () => {
      assert.strictEqual(Location.isLatitude(-91.343), false);
    });

    it('should return false when called with value out of range (upper bound)', () => {
      assert.strictEqual(Location.isLatitude(91.343), false);
    });

    it('should return false when called with undefined value', () => {
      assert.strictEqual(Location.isLatitude(undefined), false);
    });
  });

  describe('#isLongitude', () => {
    it('should return true when called with valid value', () => {
      assert.strictEqual(Location.isLongitude(115.133), true);
    });

    it('should return false when called with value out of range (lower bound)', () => {
      assert.strictEqual(Location.isLongitude(-191.343), false);
    });

    it('should return false when called with value out of range (upper bound)', () => {
      assert.strictEqual(Location.isLongitude(191.343), false);
    });

    it('should return false when called with undefined value', () => {
      assert.strictEqual(Location.isLongitude(undefined), false);
    });
  });
});
