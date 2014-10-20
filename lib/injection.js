var ejs = require('ejs');
var q = require('q');
var debug = require('debug')('slidecast');

/**
 * Returns a Promise of the rendered template
 */
function renderTemplate(presId, isPresenter, presenterKey, mobile) {
  var deferred = q.defer();
  ejs.renderFile(
    'templates/slideshare-patch.ejs', 
    { cache: true, presId: presId, isPresenter: isPresenter, presenterKey: presenterKey, mobile: mobile },
    function (error, data) {
      if (error) {
        debug('Failed to render template', error);
        deferred.reject(error);
      } else {
        debug('Successfully rendered template');
        deferred.resolve(data);
      }
    }
  );
  return deferred.promise;
}

/**
 * Returns a Promise of a copy of the given HTML, 
 * with all of our custom HTML injected before the </body> tag.
 */
exports.injectSlidesharePatch = function(html, presId, isPresenter, presenterKey, mobile) {
  return renderTemplate(presId, isPresenter, presenterKey, mobile)
    .then(function(data) {
      debug('Injecting patch into HTML source');
      return html.replace("</body>", data + "</body>");
    });
}
