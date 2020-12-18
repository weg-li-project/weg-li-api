const assert = require("assert");
const uuid = require("uuid");
const Report = require("../../../src/models/report");
const User = require("../../../src/models/user");
const Location = require("../../../src/models/location");

/**
 * @author Lukas Trommer
 */
describe("Report", function () {
    let validReport = new Report(uuid.v4(), User.generate(), 1, 0, new Location(0, 0),
        uuid.v4());

    describe("#constructor", function () {
        it("should throw error when initialized with invalid ID", function () {
            assert.throws(() => new Report("some-invalid-id", validReport.user, validReport.violationType,
                validReport.time, validReport.location, validReport.imageToken));
        });

        it("should throw error when initialized with invalid violation type", function () {
            assert.throws(() => new Report(validReport.id, validReport.user, "violation-type", validReport.time,
                validReport.location, validReport.imageToken))
        })

        it("should throw error when initialized without location", function () {
            assert.throws(() => new Report(validReport.id, validReport.user, validReport.violationType,
                validReport.time, null, validReport.imageToken))
        });
    });

    describe("#create", function () {
        it("should return a new Report object with valid ID", function () {
            assert.strictEqual(Report.validateID(Report.create(validReport.user, validReport.violationType,
                validReport.time, validReport.location, validReport.imageToken).id), true);
        });
    });

    describe("#validateID", function () {
        it("should return true when called with a valid ID", function () {
            assert.strictEqual(Report.validateID(uuid.v4()), true);
        });

        it("should return false when called with invalid ID", function () {
            assert.strictEqual(Report.validateID("some-invalid-id"), false);
        });
    });
});