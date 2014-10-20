var presentations = require('../lib/presentations');
var httpclient = require('../lib/httpclient');
var injection = require('../lib/injection');
var uaparser = require('ua-parser');
var debug = require('debug')('slidecast');

function retrieveInjectAndRespond(res, presentation, isPresenter, userAgentHeader) {
    // スライドをSlideshareからダウンロードする
    httpclient.getUrl(presentation.url)
      .then(function(responseData) {
        // Slidecast用のコードを注入する
        return injection.injectSlidesharePatch(responseData.body, presentation.presId, isPresenter, presentation.presenterKey);
      })
      .then(function(html) {
        // UAをsniffして、iOS 8 の場合は特殊なCSSを注入
        var ua = uaparser.parse(userAgentHeader);
        var ios8 = (ua.os.family === 'iOS' && ua.os.major == '8');
        return injection.injectCSS(html, ios8);
      })
      .then(function(htmlWithInjection) {
        // クライアントに返す
        res.send(htmlWithInjection);
      }, function(error) {
        debug(error);
        res.status(500)
      });
}

exports.viewPresentation = function(res, presId, userAgentHeader) {
  presentations.findById(presId)
    .then(function(presentation) {
      if (!presentation) {
        res.status(404);
      } else {
        retrieveInjectAndRespond(res, presentation, false, userAgentHeader);
      }
    });
}

exports.presentPresentation = function(res, presId, inputPassword, redirectTo, userAgentHeader) {
  presentations.findById(presId)
    .then(function(presentation) {
      if (!presentation) {
        res.status(404);
      } else {
        if (inputPassword != presentation.password) {
          debug('Incorrect password. Redirecting to password form');
          res.redirect(redirectTo);
        } else {
          retrieveInjectAndRespond(res, presentation, true, userAgentHeader);
        }
      }
    });
}
