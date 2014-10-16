var presentations = require('../lib/presentations');
var httpclient = require('../lib/httpclient');
var injection = require('../lib/injection');
var debug = require('debug')('slidecast');

function retrieveInjectAndRespond(res, presentation, isPresenter) {
    // スライドをSlideshareからダウンロードする
    httpclient.getUrl(presentation.url)
      .then(function(responseData) {
        // Slidecast用のコードを注入する
        return injection.injectSlidesharePatch(responseData.body, presentation.presId, isPresenter, presentation.presenterKey);
      })
      .then(function(htmlWithInjection) {
        // クライアントに返す
        res.send(htmlWithInjection);
      }, function(error) {
        debug(error);
        res.status(500)
      });
}

exports.viewPresentation = function(res, presId) {
  presentations.findById(presId)
    .then(function(presentation) {
      if (!presentation) {
        res.status(404);
      } else {
        retrieveInjectAndRespond(res, presentation, false);
      }
    });
}

exports.presentPresentation = function(res, presId, inputPassword, redirectTo) {
  presentations.findById(presId)
    .then(function(presentation) {
      if (!presentation) {
        res.status(404);
      } else {
        if (inputPassword != presentation.password) {
          debug('Incorrect password. Redirecting to password form');
          res.redirect(redirectTo);
        } else {
          retrieveInjectAndRespond(res, presentation, true);
        }
      }
    });
}
