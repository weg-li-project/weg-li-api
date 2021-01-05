const rewiremock = require("rewiremock/node");
const supertest = require("supertest");
const express = require("express");
const uuid = require("uuid");
const { StatusCode } = require("status-code-enum")
const Authorization = require("../../src/core/authorization");
const { PublicOrderOffice } = require("../../src/core/public-order-office");
const User = require("../../src/models/user");
const errors = require("../../src/controllers/assets/errors");

const ENDPOINT = "/report"

describe(`POST ${ENDPOINT} (Report Creation)`, async function () {
    let app = express()

    let mockUser = User.generate();
    let mockAccessToken = Authorization.generateAccessToken();
    let mockImageToken = uuid.v4();
    let imageTokenExisting = true;
    let publicOrderOfficeExisting = true;

    let RewiredAuthorization = function () { };
    let RewiredReportDatabaseHandle = function (database) { };
    let RewiredFileStorage = { };
    let RewiredPublicOrderOfficeResolver = function (zipcode) { }

    // Rewire authorization methods
    RewiredAuthorization.authorizeUser = async (user, accessToken) => {
        return accessToken === mockAccessToken;
    };

    RewiredAuthorization.validateAuthorizationHeader = Authorization.validateAuthorizationHeader;
    RewiredAuthorization.extractAccessToken = Authorization.extractAccessToken;

    // Rewire report database handle
    RewiredReportDatabaseHandle.prototype.insertReport = async (report) => undefined;

    // Rewire file storage
    RewiredFileStorage.getFilesByToken = async (imageToken) => imageTokenExisting ? ["some image url"] : [];

    // Rewire public order office resolver
    RewiredPublicOrderOfficeResolver.prototype.resolve = async () =>
        publicOrderOfficeExisting ? new PublicOrderOffice("Musterstadt", "ordnungsamt@musterstadt.de") : null;

    before(function () {
        rewiremock("../../src/core/authorization.js").with(RewiredAuthorization);
        rewiremock("../../src/core/database/database-reports.js").with(RewiredReportDatabaseHandle);
        rewiremock("../../src/core/file-storage.js").with(RewiredFileStorage);

        rewiremock("../../src/core/public-order-office.js").with({
            PublicOrderOffice,
            PublicOrderOfficeResolver: RewiredPublicOrderOfficeResolver
        });

        rewiremock.enable();
        app.use(require("../../src/index").api);
    });

    after(function () {
        rewiremock.disable();
    });

    it("should return an HTTP status code 200 (OK) with empty response body when the creation was successful",
        function (done) {
            imageTokenExisting = true
            publicOrderOfficeExisting = true

            let mockRequestBody = {
                user_id: mockUser.id,
                report: {
                    violation_type: 1,
                    time: Math.floor(Date.now() / 1000),
                    location: {
                        latitude: 52.550127300460765,
                        longitude: 13.37069649848694
                    },
                    image_token: mockImageToken
                },
                zipcode: "13357"
            };

            supertest(app).post(ENDPOINT).set("Authorization", `Bearer ${mockAccessToken}`).send(mockRequestBody)
                .expect(StatusCode.SuccessOK)
                .expect({
                    public_order_office: {
                        name: "Musterstadt",
                        email_address: "ordnungsamt@musterstadt.de"
                    }
                }, done);
    });

    it("should return an HTTP status code 200 (OK) with empty response body when called without Authorization " +
        "header, without user ID and when the creation was successful",
        function (done) {
            imageTokenExisting = true
            publicOrderOfficeExisting = true

            let mockRequestBody = {
                report: {
                    violation_type: 1,
                    time: Math.floor(Date.now() / 1000),
                    location: {
                        latitude: 52.550127300460765,
                        longitude: 13.37069649848694
                    },
                    image_token: mockImageToken
                },
                zipcode: "13357"
            };

            supertest(app).post(ENDPOINT).send(mockRequestBody).expect(StatusCode.SuccessOK).expect({
                public_order_office: {
                    name: "Musterstadt",
                    email_address: "ordnungsamt@musterstadt.de"
                }
            }, done);
    });

    it("should return an HTTP status code 403 (Forbidden) when called with valid Authorization header not " +
        "related to the provided user ID",
        function (done) {
            imageTokenExisting = true
            publicOrderOfficeExisting = true

            let mockRequestBody = {
                user_id: mockUser.id,
                report: {
                    violation_type: 1,
                    time: Math.floor(Date.now() / 1000),
                    location: {
                        latitude: 52.550127300460765,
                        longitude: 13.37069649848694
                    },
                    image_token: mockImageToken
                },
                zipcode: "13357"
            };

            supertest(app).post(ENDPOINT).set("Authorization", `Bearer ${Authorization.generateAccessToken()}`)
                .send(mockRequestBody).expect(StatusCode.ClientErrorForbidden).expect({}, done);
    });

    it("should return an HTTP status code 400 (Bad Request) when called without request body",
        function (done) {
            imageTokenExisting = true
            publicOrderOfficeExisting = true

            supertest(app).post(ENDPOINT).set("Authorization", `Bearer ${mockAccessToken}`).send()
                .expect(StatusCode.ClientErrorBadRequest).expect({}, done);
    });

    it("should return an HTTP status code 400 (Bad Request) when called without violation type",
        function (done) {
            imageTokenExisting = true
            publicOrderOfficeExisting = true

            let mockRequestBody = {
                user_id: mockUser.id,
                report: {
                    time: Math.floor(Date.now() / 1000),
                    location: {
                        latitude: 52.550127300460765,
                        longitude: 13.37069649848694
                    },
                    image_token: mockImageToken
                },
                zipcode: "13357"
            };

            supertest(app).post(ENDPOINT).set("Authorization", `Bearer ${mockAccessToken}`).send(mockRequestBody)
                .expect(StatusCode.ClientErrorBadRequest).expect({}, done);
    });

    it("should return an HTTP status code 400 (Bad Request) when called without violation type",
        function (done) {
            imageTokenExisting = true
            publicOrderOfficeExisting = true

            let mockRequestBody = {
                user_id: mockUser.id,
                report: {
                    time: Math.floor(Date.now() / 1000),
                    location: {
                        latitude: 52.550127300460765,
                        longitude: 13.37069649848694
                    },
                    image_token: mockImageToken
                },
                zipcode: "13357"
            };

            supertest(app).post(ENDPOINT).set("Authorization", `Bearer ${mockAccessToken}`).send(mockRequestBody)
                .expect(StatusCode.ClientErrorBadRequest).expect({}, done);
    });

    it("should return an HTTP status code 400 (Bad Request) when called without violation time",
        function (done) {
            imageTokenExisting = true
            publicOrderOfficeExisting = true

            let mockRequestBody = {
                user_id: mockUser.id,
                report: {
                    violation_type: 1,
                    location: {
                        latitude: 52.550127300460765,
                        longitude: 13.37069649848694
                    },
                    image_token: mockImageToken
                },
                zipcode: "13357"
            };

            supertest(app).post(ENDPOINT).set("Authorization", `Bearer ${mockAccessToken}`).send(mockRequestBody)
                .expect(StatusCode.ClientErrorBadRequest).expect({}, done);
    });

    it("should return an HTTP status code 400 (Bad Request) when called without location",
        function (done) {
            imageTokenExisting = true
            publicOrderOfficeExisting = true

            let mockRequestBody = {
                user_id: mockUser.id,
                report: {
                    violation_type: 1,
                    time: Math.floor(Date.now() / 1000),
                    image_token: mockImageToken
                },
                zipcode: "13357"
            };

            supertest(app).post(ENDPOINT).set("Authorization", `Bearer ${mockAccessToken}`).send(mockRequestBody)
                .expect(StatusCode.ClientErrorBadRequest).expect({}, done);
    });

    it("should return an HTTP status code 400 (Bad Request) when called without image token",
        function (done) {
            imageTokenExisting = true
            publicOrderOfficeExisting = true

            let mockRequestBody = {
                user_id: mockUser.id,
                report: {
                    violation_type: 1,
                    time: Math.floor(Date.now() / 1000),
                    location: {
                        latitude: 52.550127300460765,
                        longitude: 13.37069649848694
                    }
                },
                zipcode: "13357"
            };

            supertest(app).post(ENDPOINT).set("Authorization", `Bearer ${mockAccessToken}`).send(mockRequestBody)
                .expect(StatusCode.ClientErrorBadRequest).expect({}, done);
    });

    it("should return an HTTP status code 400 (Bad Request) when called with invalid image token",
        function (done) {
            imageTokenExisting = true
            publicOrderOfficeExisting = true

            let mockRequestBody = {
                user_id: mockUser.id,
                report: {
                    violation_type: 1,
                    time: Math.floor(Date.now() / 1000),
                    location: {
                        latitude: 52.550127300460765,
                        longitude: 13.37069649848694
                    },
                    image_token: "invalid token"
                },
                zipcode: "13357"
            };

            supertest(app).post(ENDPOINT).set("Authorization", `Bearer ${mockAccessToken}`).send(mockRequestBody)
                .expect(400).expect({}, done);
    });

    it("should return an HTTP status code 409 (Conflict) when called with non-existent image token",
        function (done) {
            imageTokenExisting = false
            publicOrderOfficeExisting = true

            let mockRequestBody = {
                user_id: mockUser.id,
                report: {
                    violation_type: 1,
                    time: Math.floor(Date.now() / 1000),
                    location: {
                        latitude: 52.550127300460765,
                        longitude: 13.37069649848694
                    },
                    image_token: mockImageToken
                },
                zipcode: "13357"
            };

            supertest(app).post(ENDPOINT).set("Authorization", `Bearer ${mockAccessToken}`).send(mockRequestBody)
                .expect(StatusCode.ClientErrorConflict).expect(errors.UNKNOWN_IMAGE_TOKEN, done);
    });

    it("should return an HTTP status code 400 (Bad Request) when called without zipcode",
        function (done) {
            imageTokenExisting = true
            publicOrderOfficeExisting = true

            let mockRequestBody = {
                user_id: mockUser.id,
                report: {
                    violation_type: 1,
                    time: Math.floor(Date.now() / 1000),
                    location: {
                        latitude: 52.550127300460765,
                        longitude: 13.37069649848694
                    },
                    image_token: mockImageToken
                }
            };

            supertest(app).post(ENDPOINT).set("Authorization", `Bearer ${mockAccessToken}`).send(mockRequestBody)
                .expect(StatusCode.ClientErrorBadRequest).expect({}, done);
        });

    it("should return an HTTP status code 409 (Conflict) when called with unresolvable zipcode",
        function (done) {
            imageTokenExisting = true
            publicOrderOfficeExisting = false

            let mockRequestBody = {
                user_id: mockUser.id,
                report: {
                    violation_type: 1,
                    time: Math.floor(Date.now() / 1000),
                    location: {
                        latitude: 52.550127300460765,
                        longitude: 13.37069649848694
                    },
                    image_token: mockImageToken
                },
                zipcode: "07343"
            };

            supertest(app).post(ENDPOINT).set("Authorization", `Bearer ${mockAccessToken}`).send(mockRequestBody)
                .expect(StatusCode.ClientErrorConflict).expect(errors.UNKNOWN_PUBLIC_ORDER_OFFICE, done);
        });
});