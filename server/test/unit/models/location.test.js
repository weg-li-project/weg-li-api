const assert = require("assert");
const Location = require("../../../src/models/location");

/**
 * @author Lukas Trommer
 */
describe("Location", function () {
    describe("#construtor", function () {
        it("should throw error when initialized with values out of range", function () {
            assert.throws(() => new Location(91.013, -280.9083));
        });

        it("should throw error when initialized with undefined values", function () {
            assert.throws(() => new Location(undefined, undefined));
        });
    })

    describe("#isLatitude", function () {
        it('should return true when called with valid value', function () {
            assert.strictEqual(Location.isLatitude(45.133), true);
        });

        it('should return false when called with value out of range (lower bound)', function () {
            assert.strictEqual(Location.isLatitude(-91.343), false);
        });

        it('should return false when called with value out of range (upper bound)', function () {
            assert.strictEqual(Location.isLatitude(91.343), false);
        });

        it('should return false when called with undefined value', function () {
            assert.strictEqual(Location.isLatitude(undefined), false);
        });
    })

    describe("#isLongitude", function () {
        it('should return true when called with valid value', function () {
            assert.strictEqual(Location.isLongitude(115.133), true);
        });

        it('should return false when called with value out of range (lower bound)', function () {
            assert.strictEqual(Location.isLongitude(-191.343), false);
        });

        it('should return false when called with value out of range (upper bound)', function () {
            assert.strictEqual(Location.isLongitude(191.343), false);
        });

        it('should return false when called with undefined value', function () {
            assert.strictEqual(Location.isLongitude(undefined), false);
        });
    })
})