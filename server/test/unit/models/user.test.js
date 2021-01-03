const assert = require('assert');
const User = require('../../../src/models/user');

/** @author Lukas Trommer */
describe('User', () => {
  describe('#constructor', () => {
    it('should throw error when initialized with invalid ID', () => {
      assert.throws(() => new User('some-invalid-id'));
    });
  });

  describe('#generate', () => {
    it('should return a new User object with valid ID', () => {
      assert.strictEqual(User.validateID(User.generate().id), true);
    });
  });

  describe('#validateID', () => {
    it('should return true when called with a valid ID', () => {
      assert.strictEqual(
        User.validateID('123e4567-e89b-12d3-a456-426614174000'),
        true
      );
    });

    it('should return false when called with invalid ID', () => {
      assert.strictEqual(User.validateID('some-invalid-id'), false);
    });
  });
});
