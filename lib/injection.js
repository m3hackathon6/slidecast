var ejs = require('ejs');
var q = require('q');
var debug = require('debug')('slidecast');

/**
 * Returns a Promise of the rendered template
 */
function renderTemplate(presId, isPresenter, presenterKey) {
  var deferred = q.defer();
  ejs.renderFile(
    'templates/slideshare-patch.ejs', 
    { cache: true, presId: presId, isPresenter: isPresenter, presenterKey: presenterKey },
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
exports.injectSlidesharePatch = function(html, presId, isPresenter, presenterKey) {
  return renderTemplate(presId, isPresenter, presenterKey)
    .then(function(data) {
      debug('Injecting patch into HTML source');
      return html.replace('</body>', data + '</body>');
    });
}

/**
 * Returns a copy of the given HTML,
 * with a link to our custom CSS injected before the </head> tag.
 *
 * @param ios8 Is the client an iOS 8 device?
 */
exports.injectCSS = function(html, ios8) {
  if (ios8) {
    debug('Injecting iOS8-specific CSS');
    return html.replace('</head>', 
        '<link rel="stylesheet" type="text/css" href="/stylesheets/ios8.css"></head>');
  } else {
    // this might work on iOS 7.1, should be ignored by all other devices
    return html.replace('</head>', 
        '<meta name="viewport" content="minimal-ui" /></head>');
  }
}
