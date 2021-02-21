const { setWorldConstructor, World } = require('@cucumber/cucumber');

const context = {
    headers: {},
};

class APIWorld extends World {
    constructor(options) {
        super(options);
        if ('BASE_URL' in process.env) {
            this.base_url = process.env.BASE_URL;
        } else {
            throw new Error('The environment variable BASE_URL is missing.');
        }
        this.context = context;
    }

    getAbsoluteUrl(url) {
        return `${this.base_url}${url}`;
    }
}

setWorldConstructor(APIWorld);