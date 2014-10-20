var presentations = require('../lib/presentations');
var httpclient = require('../lib/httpclient');
var injection = require('../lib/injection');
var cheerio = require('cheerio');
var debug = require('debug')('slidecast');

/**
 * GETs the presentation from Slideshare.
 * Returns a Promise of { response: ..., body: ... }
 */
function retrieve(presentation) {
  // スライドをSlideshareからダウンロードする
  return httpclient.getUrl(presentation.url)
    .then(function(responseData) {
      if (presentation.url.search(/embed/) < 0) {
        // embed用のURLを抽出してダウンロードする
        var $ = cheerio.load(responseData.body);
        var embedUrl = $('meta.twitter_player').attr('value');
        debug('Downloading Embed URL', embedUrl);
        return httpclient.getUrl(embedUrl)
      } else {
        debug('This looks like an embed URL', presentation.url);
        // 既にembed用のURLを持っているのでそのまま返す
        return responseData;
      }
    });
}

function retrieveInjectAndRespond(res, presentation, isPresenter) {
  retrieve(presentation)
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
