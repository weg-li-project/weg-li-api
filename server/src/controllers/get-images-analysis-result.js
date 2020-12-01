const gaxios = require("gaxios")
const FileStorage = require("../core/file-storage");

const IMAGE_ANALYSIS_ENDPOINT = process.env.IMAGE_ANAYLSIS_ENDPOINT

/**
 * Controller function for the image analysis endpoint.
 * Expects a path parameter imageToken.
 * Returns suggestions for license plate and vehicle features.
 *
 * @param {e.Request} request - An express request object.
 * @param {e.Response} response - An express response object.
 */
async function getImageAnalysisResults(request, response) {
    const imageToken = request.params.imageToken

    try {
        const cloudStorageUrls = await FileStorage.getCloudStorageUrlsByToken(imageToken)
        const data = {"google_cloud_urls": cloudStorageUrls}
        const options = {method: "POST", url: IMAGE_ANALYSIS_ENDPOINT, data: data}
        const suggestions = await gaxios.request(options)
        response.json(suggestions)
    } catch(error) {
        response.status(400).json({error: error.name, description: error.message})
    }
}

module.exports = getImageAnalysisResults
