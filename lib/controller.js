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
      res.status(500);
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
};

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
};


exports.addPresentation = function(res, presId, url, password, body) {
  var error = {};
  error.url = (url) ? "" : "URLは必須入力です.";
  error.password = (password) ? "" : "Passwordは必須入力です.";
  if (!url || !password){
    renderIndexPage(res, error);
    return;
  }
  
  if (presId) {
    // Check the user's chosen presId is not already taken
    presentations.findById(presId)
      .then(function(presentation) {
        if (presentation) {
          error.presId = presId + ":このIDは既に使用されています。";
          renderIndexPage(res, error);
        } else {
          // Register using user's chosen presId
          savePresentation(res, presId, url, password, body);
        }
      });
  } else {
    // User did not choose a presId. Save with a random one.
    createNewPresId().then(function(newPresId){
      savePresentation(res, newPresId, url, password, body);
    });
  }
};

function savePresentation(res, presId, url, password, body){
  presentations.save(presId, url, password).then(
    function(result){
      if (!result) {
        res.status(404);
      } else {
        res.redirect(makeQrCodeUrl(body,presId));
      }
    });
}

/**
 * QRCode表示
 */
exports.showQRCode = function(res, presId, body) {
  presentations.findById(presId)
    .then(function(presentation) {
      if (presentation) {
        res.redirect(makeQrCodeUrl(body,presId));
      } else {
        var error = {presId: presId + ":このIDは存在しません。"};
        renderIndexPage(res, error);
      }
    });
};

exports.loadIndexPage = function(res){
  renderIndexPage(res);
};

/**
 * 直近10件の履歴を読み込み、画面をレンダリングする
 * @param error エラー項目に対するメッセージ(id, url, password)
 */
function renderIndexPage(res, error){
  presentations.findHistoryList()
    .then(function(historyList){
      res.render('index', { title: 'Slidecast', historyList : historyList, error:error});
  });
};
/**
 * @return QRコード表示用のURLを返す(QRCodeGenerator:http://goqr.me/api/)
 */
function makeQrCodeUrl(body, presId){
  return "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" + body + presId;
}

/**
 * @return Redisに未登録のKeyを採番します
 */
function createNewPresId(){
  var randomNumber = Math.floor(Math.random() * 100000000);
  var presId = randomNumber.toString(36);
  return presentations.findById(presId)
    .then(function(value){
      if (value){
        return createNewPresId();
      }
      return presId;
    });
};
