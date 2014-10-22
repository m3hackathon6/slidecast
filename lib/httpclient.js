var request = require('request');
var q = require('q');
var debug = require('debug')('slidecast');

/**
 * GETs the given URL.
 * Returns a Promise of { response: ..., body: ... }
 */
exports.getUrl = function(url, userAgent) {
  var options = { url: url };
  if (!!userAgent) {
    options.headers = { 'User-Agent': userAgent }
  }
  debug(options);
  var deferred = q.defer();
  request(options, function(error, response, body) {
    if (error) {
      debug('Failed to retrieve', url);
      deferred.reject(error);
    } else {
      debug('Successfully retrieved', url);
      deferred.resolve({ response: response, body: body });
    }
  }); 
  return deferred.promise;
}
