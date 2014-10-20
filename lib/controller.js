var presentations = require('../lib/presentations');
var httpclient = require('../lib/httpclient');
var injection = require('../lib/injection');
var cheerio = require('cheerio');
var uaparser = require('ua-parser');
var debug = require('debug')('slidecast');

/**
 * GETs the presentation from Slideshare.
 * Returns a Promise of { response: ..., body: ... }
 */
function retrieve(presentation, mobile, userAgentHeader) {
  // スライドをSlideshareからダウンロードする
  return httpclient.getUrl(presentation.url) // do not use mobile UA here
    .then(function(responseData) {
      if (presentation.url.search(/embed/) < 0) {
        var $ = cheerio.load(responseData.body);
        if (mobile) {
          // スマホ用のURLを抽出してダウンロードする
          var mobileUrl = $('link[media=handheld]').attr('href');
          debug('Downloading Mobile URL', mobileUrl);
          return httpclient.getUrl(mobileUrl, userAgentHeader);
        } else {
          // embed用のURLを抽出してダウンロードする
          var embedUrl = $('meta.twitter_player').attr('value');
          debug('Downloading Embed URL', embedUrl);
          return httpclient.getUrl(embedUrl, userAgentHeader);
        }
      } else {
        debug('This looks like an embed URL', presentation.url);
        // 既にembed用のURLを持っているのでそのまま返す
        return responseData;
      }
    });
}

function retrieveInjectAndRespond(res, presentation, isPresenter, userAgentHeader) {
  var ua = uaparser.parse(userAgentHeader);
  var mobile = ua.os.family === 'iOS' || ua.os.family === 'Android';
  debug('mobile', mobile, ua);
  retrieve(presentation, mobile, userAgentHeader)
    .then(function(responseData) {
      // Slidecast用のコードを注入する
      return injection.injectSlidesharePatch(responseData.body, presentation.presId, isPresenter, presentation.presenterKey, mobile);
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
