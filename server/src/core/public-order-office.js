const gaxios = require('gaxios');
const { StatusCode } = require('status-code-enum');

/**
 * This class represents basic information of a public order office.
 *
 * @author Lukas Trommer
 * @class
 * @param name The name of the office, usually the name of the city this office
 *     belongs to.
 * @param emailAddress The email address of this office which must be used for
 *     reporting violation reports.
 */
function PublicOrderOffice(name, emailAddress) {
  if (!name || !emailAddress) {
    throw new Error('Incomplete public order office data');
  }

  this.name = name;
  this.emailAddress = emailAddress;
}

/**
 * This class resolves a provided zipcode to the responsible public order office.
 *
 * @author Lukas Trommer
 * @class
 */
function PublicOrderOfficeResolver() {}

/**
 * Resolve the provided zipcode to the public order office information by
 * fetching the required information from the corresponding weg-li endpoint.
 *
 * @author Lukas Trommer
 * @param zipcode {String} The zipcode that should be resolved.
 * @returns {Promise<null | PublicOrderOffice>} The resolved public order office
 *     or null if the zipcode could not be resolved.
 */
PublicOrderOfficeResolver.prototype.resolve = async function (zipcode) {
  if (!zipcode) {
    throw new Error('No zipcode specified');
  }
  let response;

  try {
    response = await gaxios.request({
      url: `https://www.weg-li.de/districts/${zipcode}.json`,
    });
  } catch (e) {
    if (e.response && e.response.status === StatusCode.ClientErrorNotFound) {
      return null;
    }
    throw e;
  }

  if (response.data) {
    const { name } = response.data;
    const emailAddress = response.data.email;

    if (!name || !emailAddress) {
      return null;
    }
    return new PublicOrderOffice(name, emailAddress);
  }
  throw new Error(
    'Invalid remote server response while resolving public order office'
  );
};

module.exports = {
  PublicOrderOffice,
  PublicOrderOfficeResolver,
};
