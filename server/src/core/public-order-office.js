const axios = require("axios");
const { StatusCode } = require("status-code-enum")

/**
 * This class represents basic information of a public order office.
 *
 * @param name The name of the office, usually the name of the city this office belongs to.
 * @param emailAddress The email address of this office which must be used for reporting violation reports.
 * @constructor
 * @author Lukas Trommer
 */
function PublicOrderOffice(name, emailAddress) {
    if (!name || !emailAddress) {
        throw new Error("Incomplete public order office data");
    }

    this.name = name;
    this.emailAddress = emailAddress;
}

/**
 * This class resolves a provided zipcode to the responsible public order office.
 *
 * @constructor
 * @author Lukas Trommer
 */
function PublicOrderOfficeResolver() { }

/**
 * Resolve the provided zipcode to the public order office information by fetching the required information from the
 * corresponding weg-li endpoint.
 *
 * @param zipcode The zipcode that should be resolved.
 * @returns {Promise<null|PublicOrderOffice>} The resolved public order office or null if the zipcode could not be
 * resolved.
 * @author Lukas Trommer
 */
PublicOrderOfficeResolver.prototype.resolve = async function (zipcode) {
    if (!zipcode) {
        throw new Error("No zipcode specified");
    }
    let response;

    try {
        response = await axios.get(`https://www.weg-li.de/districts/${zipcode}.json`);
    } catch (e) {
        if (e.response && e.response.status === StatusCode.ClientErrorNotFound) {
            return null;
        } else {
            throw e;
        }
    }

    if (response.data) {
        let name = response.data.name;
        let emailAddress = response.data.email;

        if (!name || !emailAddress) {
            return null;
        } else {
            return new PublicOrderOffice(name, emailAddress);
        }
    } else {
        throw new Error("Invalid remote server response while resolving public order office");
    }
}

module.exports = {
    PublicOrderOffice, PublicOrderOfficeResolver
}