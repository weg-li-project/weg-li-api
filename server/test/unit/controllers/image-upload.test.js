const rewiremock = require('rewiremock/node');
const assert = require("assert");
const sinon = require('sinon');

const mockRequest = () => {
    return {query: {quantity: 1}}
}

const mockResponse = () => {
    const res = {}
    res.status = sinon.stub().returns(res)
    res.json = sinon.stub().returns(res)
    return res
}

describe("getSignedStorageUrl", () => {
    it("should return status 409 when getUniqueFolderName throws", async () => {
        rewiremock("../../../src/core/file-storage.js").with({
            async getUniqueFolderName() {
                throw new Error()
            }
        })
        rewiremock.enable()
        const controller = require("../../../src/controllers/image-upload")
        const req = mockRequest()
        const res = mockResponse()

        await controller(req, res)

        assert.ok(res.status.calledOnce)
        assert.deepStrictEqual(res.status.firstCall.args, [409])
        assert.ok(res.json.calledOnce)
        assert.deepStrictEqual(res.json.firstCall.args, [{error: "Error", description: ""}])
        rewiremock.disable()
    })

    it("should return status 409 when generateV4UploadSignedUrls throws", async () => {
        rewiremock("../../../src/core/file-storage.js").with({
            async getUniqueFolderName() {
                return "Unique Folder Name"
            },
            async generateV4UploadSignedUrls(folderName, quantity) {
                throw new Error()
            }
        })
        rewiremock.enable()
        const controller = require("../../../src/controllers/image-upload")
        const req = mockRequest()
        const res = mockResponse()

        await controller(req, res)

        assert.ok(res.status.calledOnce)
        assert.deepStrictEqual(res.status.firstCall.args, [409])
        assert.ok(res.json.calledOnce)
        assert.deepStrictEqual(res.json.firstCall.args, [{error: "Error", description: ""}])
        rewiremock.disable()
    })

    it("should return provided folder name and signed urls", async () => {
        rewiremock("../../../src/core/file-storage.js").with({
            async getUniqueFolderName() {
                return "Unique Folder Name"
            },
            async generateV4UploadSignedUrls(folderName, quantity) {
                return Array(quantity).fill("URL")
            }
        })
        rewiremock.enable()
        const controller = require("../../../src/controllers/image-upload")
        const req = mockRequest()
        const res = mockResponse()

        await controller(req, res)

        assert.ok(res.json.calledOnce)
        assert.deepStrictEqual(res.json.firstCall.args, [{token: 'Unique Folder Name', google_cloud_urls: ['URL']}])
        rewiremock.disable()
    })
})