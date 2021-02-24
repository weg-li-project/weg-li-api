const assert = require('assert');
const gaxios = require('gaxios');

const fs = require('fs');
const FileStorage = require('../../src/core/file-storage');
const { needsGoogleIntegration } = require('../helpers/skipper');

describe('FileStorage', () => {
  before(function fun() {
    needsGoogleIntegration(this);
  });

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
        data: fs
          .readFileSync(`${__dirname}/../assets/pixel.jpg`)
          .toString('binary'),
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
