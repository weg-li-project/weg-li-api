const rewiremock = require("rewiremock/node");
const supertest = require("supertest");
const express = require("express");
const User = require("../../src/models/user");
const Authorization = require("../../src/core/authorization");

const ENDPOINT = "/user/:user_id"
const getEndpoint = (user) => ENDPOINT.replace(":user_id", user.id)

describe(`DELETE ${ENDPOINT} (User Deletion)`, function () {
    let app = express()

    let mockUser = User.generate();
    let mockAccessToken = Authorization.generateAccessToken();

    let RewiredAuthorization = Authorization;
    let RewiredUserDatabaseHandle = function (database) { };
    let RewiredReportDatabaseHandle = function (database) { };
    let RewiredFileStorage = { };

    // Rewire authorization methods
    RewiredAuthorization.authorizeUser = async (user, accessToken) => {
        return accessToken === mockAccessToken;
    };
    RewiredAuthorization.deleteAuthorization = async (user) => undefined;

    // Rewire user database handle
    RewiredUserDatabaseHandle.prototype.deleteUser = async (user) => undefined;

    let MockDatabase = function () { };
    let MockTransaction = function () { };
    MockTransaction.prototype.commit = () => undefined;
    MockTransaction.prototype.rollback = () => undefined;
    MockDatabase.prototype.newTransaction = () => new MockTransaction();
    RewiredUserDatabaseHandle.prototype.database = new MockDatabase();

    // Rewire report database handle
    RewiredReportDatabaseHandle.prototype.queryUserReportImageTokens = async (user) => [];
    RewiredReportDatabaseHandle.prototype.deleteUserReports = async (user) => undefined;

    // Rewire file storage
    RewiredFileStorage.deleteImagesByTokens = async (imageTokens) => undefined;

    rewiremock("../../src/core/authorization.js").with(RewiredAuthorization);
    rewiremock("../../src/core/database/database-users.js").with(RewiredUserDatabaseHandle);
    rewiremock("../../src/core/database/database-reports.js").with(RewiredReportDatabaseHandle);
    rewiremock("../../src/core/file-storage.js").with(RewiredFileStorage);

    before(function () {
        rewiremock.enable();
        app.use(require("../../src/index").api)
    });

    after(function () {
        rewiremock.disable()
    })

    it("should return an HTTP status code 200 (OK) with empty response body when the deletion was successful",
        async function () {
            await supertest(app).delete(getEndpoint(mockUser)).set("Authorization", `Bearer ${mockAccessToken}`).send()
                .expect(200).expect({});
    });

    it("should return an HTTP status code 401 (Unauthorized) when called without Authorization header",
        async function () {
            await supertest(app).delete(getEndpoint(mockUser)).send().expect(401).expect({});
    });

    it("should return an HTTP status code 403 (Forbidden) when called with valid Authorization header not " +
        "related to the user which should be deleted", async function () {
        await supertest(app).delete(getEndpoint(mockUser))
            .set("Authorization", `Bearer ${Authorization.generateAccessToken()}`).send().expect(403)
            .expect({});
    })

    it("should return an HTTP status code 400 (Bad Request) when called with invalid user ID",
        async function () {
            await supertest(app).delete(getEndpoint("invalid uuid"))
                .set("Authorization", `Bearer ${mockAccessToken}`).send().expect(400).expect({});
    });
});