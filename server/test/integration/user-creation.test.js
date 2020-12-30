const assert = require("assert");
const rewiremock = require("rewiremock/node");
const supertest = require("supertest");
const express = require("express");
const uuid = require("uuid");
const { StatusCode } = require("status-code-enum")
const Authorization = require("../../src/core/authorization");

const ENDPOINT = "/user"

describe(`POST ${ENDPOINT} (User Creation)`, function () {
    let app = express();

    let RewiredAuthorization = Authorization;
    let RewiredUserDatabaseHandle = function (database) { };

    // Rewire authorization methods
    RewiredAuthorization.storeAuthorization = (user, accessToken) => undefined;

    // Rewire user database handle
    RewiredUserDatabaseHandle.prototype.insertUser = async (user) => undefined;

    let MockDatabase = function () { };
    let MockTransaction = function () { };
    MockTransaction.prototype.commit = () => undefined;
    MockTransaction.prototype.rollback = () => undefined;
    MockDatabase.prototype.newTransaction = () => new MockTransaction();
    RewiredUserDatabaseHandle.prototype.database = new MockDatabase();

    rewiremock("../../src/core/authorization.js").with(RewiredAuthorization);
    rewiremock("../../src/core/database/database-users.js").with(RewiredUserDatabaseHandle);

    before(function () {
        rewiremock.enable();
        app.use(require("../../src/index").api)
    });

    after(function () {
        rewiremock.disable();
    });

    it("should return an HTTP status code 200 (OK) with user ID and access token in response body when the " +
        "creation was successful",
        async function () {
            await supertest(app).post(ENDPOINT).send().expect(StatusCode.SuccessOK).then(response => {
                assert.strictEqual(uuid.validate(response.body.user_id), true);
                assert.notStrictEqual(response.body.access_token.match(/^[0-9A-Fa-f]{64}$/), null);
            });
    });
});