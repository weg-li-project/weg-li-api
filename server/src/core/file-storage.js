const { Storage } = require('@google-cloud/storage')
const uuid = require('uuid')

const storage = new Storage()
const bucket = storage.bucket(BUCKET_NAME)
const BUCKET_NAME = 'weg-li_images'

/**
 * Responsible for calling Cloud Storage APIs.
 */
class FileStorage {
    static async listFilesByPrefix(prefix, delimiter, bucketName) {
        const options = {
            prefix: prefix[prefix.length - 1] === '/' ? prefix : `${prefix}/`,
            delimiter: delimiter
        }

        const [files] = await storage.bucket(bucketName).getFiles(options)

        return files.map(file => file.name)
    }

    static async generateV4UploadSignedUrls(bucketName, folderName, amount) {
        const urls = []
        for (let i = 0; i < amount; ++i) {
            const signedUploadUrl = await this.generateV4UploadSignedUrl(bucketName, `${folderName}/${i.toString()}.jpg`)
            urls.push(signedUploadUrl)
        }
        return urls
    }

    static async generateV4UploadSignedUrl(bucketName, filename) {
        const minutes = 15 * 60 * 1000 // 15 minutes
        const options = {
            version: 'v4',
            action: 'write',
            expires: Date.now() + minutes,
            contentType: 'image/jpg',
        };
        const [url] = await storage
            .bucket(bucketName)
            .file(filename)
            .getSignedUrl(options);

        return url
    }

    /**
     * Tries to delete all files identified by the given imageToken
     * parameter.
     *
     * The method throws an error in case the imageToken
     * has no valid format or the deletion process is canceled.
     *
     * @param {String} imageToken - The token follows the structure of an uuid.
     * @returns {Promise<void>}
     * @throws Error
     */
    static async deleteImagesByToken(imageToken) {
        if (!uuid.validate(imageToken)) {
            throw new Error('Invalid image token.')
        }
        try {
            await bucket.deleteFiles({directory: `${imageToken}/`, force: true})
        } catch (error) {
            throw new Error(`Couldn't delete all files linked to the provided image token "${imageToken}".`)
        }
    }

}

module.exports = FileStorage
