const assert = require('assert');
const gaxios = require('gaxios');

const fs = require('fs');
const FileStorage = require('../../../src/core/file-storage');

describe.skip('FileStorage', () => {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '<location_service_account_file>';

  describe('#deleteImagesByToken', () => {
    const fileStorage = FileStorage;

    it('should delete all images specified by the given token', async () => {
      const token = '21defa36-8370-442b-bac1-95986faba28f';
      const filename = `${token}/test.jpg`;
      const uploadUrl = await fileStorage.getUploadUrl(filename);
      const options = {
        method: 'PUT',
        url: uploadUrl,
        headers: { 'Content-Type': 'image/jpeg' },
        data: fs.readFileSync(`${__dirname}/pixel.jpg`).toString('binary'),
      };
      await gaxios.request(options);
      let files = await fileStorage.getFilesByToken(token);
      assert.strictEqual(files.length, 1);

      await fileStorage.deleteImagesByToken(token);

      files = await fileStorage.getFilesByToken(token);
      assert.strictEqual(files.length, 0);
    });
  });
});
