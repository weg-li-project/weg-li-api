const {param} = require("express-validator");
const {validate} = require("./assets/validate");

const gaxios = require("gaxios")
const FileStorage = require("../core/file-storage");
const ErrorResponse = require("../core/error-response");
const wrapper = require("./assets/wrapper");

const IMAGE_ANALYSIS_ENDPOINT = process.env.IMAGE_ANAYLSIS_ENDPOINT

/**
 * Controller function for the image analysis endpoint.
 * Expects a path parameter imageToken.
 * Returns suggestions for license plate and vehicle features.
 *
 * @param {e.Request & {params: {imageToken: string}}} request - An express request object.
 * @param {e.Response} response - An express response object.
 */
async function getImageAnalysisResults(request, response) {
    const imageToken = request.params.imageToken

    const fileUrls = await FileStorage.getFileUrlsByToken(imageToken)
    const data = {"google_cloud_urls": fileUrls}
    const options = {method: "POST", url: IMAGE_ANALYSIS_ENDPOINT, data: data}
    const suggestions = await gaxios.request(options)
    response.json(suggestions)
}

const validator = [param("imageToken").exists().isUUID("4"), validate];

module.exports = {controller: wrapper(getImageAnalysisResults), validator: validator}
