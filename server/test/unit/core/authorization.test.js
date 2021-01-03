const assert = require("assert");
const rewiremock = require("rewiremock/node")

const bcrypt = require("bcrypt");
const Authorization = require("../../../src/core/authorization");
const User = require("../../../src/models/user");

/**
 * @author Lukas Trommer
 */
describe("Authorization", function () {
    let accessToken = Authorization.generateAccessToken();
    let accessTokenHash = Authorization.hashAccessToken(accessToken);

    describe("#generateAccessToken", function () {
        it("should return a 32 byte (64 hexadecimal characters long) access token string", function () {
            assert.match(accessToken, /^[0-9A-Fa-f]{64}$/);
        });
    });

    describe("#hashAccessToken", function () {
        it("should return a valid bcrypt hash of an access token", function () {
            assert.strictEqual(bcrypt.compareSync(accessToken, accessTokenHash), true);
        });
    });

    describe("#compareAccessToken", function () {
        it('should return true when comparing a valid hash to its corresponding access token', function () {
            assert.strictEqual(Authorization.compareAccessToken(accessToken, accessTokenHash), true);
        });

        it('should return false when comparing a hash to a non-corresponding access token', function () {
            assert.strictEqual(Authorization.compareAccessToken(accessToken,
                Authorization.hashAccessToken(Authorization.generateAccessToken())), false);
        });
    });

    describe("#validateAuthorizationHeader", function () {
        it("should return true when called with a valid Authorization header", function () {
            assert.strictEqual(Authorization.validateAuthorizationHeader("Bearer " + accessToken),
                true);
        });

        it("should return false when called with an invalid Authorization header (Basic authorization)",
            function () {
            assert.strictEqual(Authorization.validateAuthorizationHeader("Basic " + accessToken),
                    false);
        });

        it("should return false when called with an invalid Authorization header (No type)", function () {
            assert.strictEqual(Authorization.validateAuthorizationHeader(accessToken), false);
        });

        it("should return false when called with undefined Authorization header", function () {
            assert.strictEqual(Authorization.validateAuthorizationHeader(undefined), false);
        });
    });

    describe("#extractAccessToken", function () {
        it("should return the access token provided as Bearer token in the Authorization header", function () {
            assert.strictEqual(Authorization.extractAccessToken("Bearer " + accessToken), accessToken);
        });

        it("should return null if no access token is provided in the Authorization header", function () {
            assert.strictEqual(Authorization.extractAccessToken("Bearer "), null);
        });

        it("should return null if the access token provided in the Authorization header is no Bearer token",
            function () {
            assert.strictEqual(Authorization.extractAccessToken("Basic " + accessToken), null);
        });

        it("should return null when called with undefined Authorization header", function () {
            assert.strictEqual(Authorization.extractAccessToken(undefined), null);
        });
    });

    describe("#authorizeUser", function () {
        let user = User.generate();

        let UserDatabaseHandle = function (database) { };

        before(function () {
            rewiremock("../../../src/core/database/database-users.js").with(UserDatabaseHandle);
            rewiremock.enable();
        });

        after(function () {
            rewiremock.disable();
        });

        it("should return true when called with user and corresponding access token", async function () {
            UserDatabaseHandle.prototype.queryUserAccess = async (user) => accessTokenHash;

            // Require Authorization module again to use rewired database handle
            let _Authorization = require("../../../src/core/authorization");

            assert.strictEqual(await _Authorization.authorizeUser(user, accessToken), true);
        });

        it("should return false when called with user and non-corresponding access token", async function () {
            UserDatabaseHandle.prototype.queryUserAccess =
                async (user) => Authorization.hashAccessToken(Authorization.generateAccessToken());

            // Require Authorization module again to use rewired database handle
            let _Authorization = require("../../../src/core/authorization");

            assert.strictEqual(await _Authorization.authorizeUser(user, accessToken), false);
        });

        it("should return false when called with undefined user", async function () {
            assert.strictEqual(await Authorization.authorizeUser(undefined, accessToken), false);
        });

        it("should return false when called with undefined access token", async function () {
            assert.strictEqual(await Authorization.authorizeUser(user, undefined), false);
        });
    });
});