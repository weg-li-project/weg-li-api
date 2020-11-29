const { Storage } = require('@google-cloud/storage')

const storage = new Storage()

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
}

module.exports = FileStorage
