var request = require('request');
var q = require('q');
var debug = require('debug')('slidecast');

/**
 * GETs the given URL.
 * Returns a Promise of { response: ..., body: ... }
 */
exports.getUrl = function(url) {
  var deferred = q.defer();
  request(url, function(error, response, body) {
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
