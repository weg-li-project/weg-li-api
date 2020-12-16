const assert = require("assert");
const User = require("../../../src/models/user");
const uuid = require("uuid");

describe("User", function () {
    describe("#constructor", function () {
        it("should throw error when initialized with invalid ID", function () {
            assert.throws(() => new User("some-invalid-id"))
        });
    })

    describe("#generate", function () {
        it('should return a new User object with valid ID', function () {
            assert.strictEqual(User.validateID(User.generate().id), true);
        });
    });

    describe("#validateID", function () {
        it("should return true when called with a valid ID", function () {
            assert.strictEqual(User.validateID("123e4567-e89b-12d3-a456-426614174000"), true);
        });

        it("should return false when called with invalid ID", function () {
            assert.strictEqual(User.validateID("some-invalid-id"), false);
        });
    })
});