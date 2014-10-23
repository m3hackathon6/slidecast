var q = require('q');
var debug = require('debug')('slidecast');
var uuid = require('node-uuid');

if (process.env.REDISTOGO_URL) {
  // Heroku + RedisToGo. Parse URL and extract host, port and password
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redisClient = require('redis').createClient(rtg.port, rtg.hostname);
  redisClient.auth(rtg.auth.split(":")[1]);
} else {
  // Use default settings (localhost:6379, no auth)
  var redisClient = require('redis').createClient();
}

function presId2redisKey(presId) {
  return "presentation:" + presId;
}

/**
 * 登録済みPresentationをRedisから取得する。
 *
 * @return PresentationのPromise
 */
exports.findById = function(presId) {
  return q.ninvoke(redisClient, 'get', presId2redisKey(presId))
    .then(function(value) { 
      debug('Redis returned', value); 
      return JSON.parse(value); 
    });
};

/**
 * 最新１０件のPresentationの履歴をRedisのキーから取得する。
 *
 * @return PresentationのPromise
 */
exports.findHisotryList= function() {
  return q.ninvoke(redisClient, 'lrange', 'history', 0, 10).then(function(value){
    debug('Redis returned', value);
    var result = [];
    for (var i in value){
      result.push(JSON.parse(value[i]));
      debug('jsonvalue', JSON.parse(value[i]));
    }
    return result;
  });
};


/**
 * PresentationをRedisに保存する。
 *
 * @return 結果のPromise
 */
exports.save = function(presId, url, password) {
  var presenterKey = uuid.v4(); // 別にセキュアじゃなくていいからUUIDを使う
  var presentation = { presId: presId, url: url, password: password, presenterKey: presenterKey };
  var value = JSON.stringify(presentation);
  var redisKey = presId2redisKey(presId);
  debug('Saving to Redis', value);
  return q.ninvoke(redisClient, 'set', redisKey, value).then(addHisotry(presId, url));
};

/**
 * Presentation履歴をリストに保存する
 *
 * @return 結果のPromise
 */
function addHisotry(presId, url){
  var history = {presId: presId, url: url};
  var value = JSON.stringify(history);
  return q.ninvoke(redisClient, 'lpush', "history", value);
};

// Uncomment this to insert dummy data into Redis
//exports.save('456', 'http://www.slideshare.net/slideshow/embed_code/28955608', 'passw0rd');
//exports.save('456', 'http://www.slideshare.net/cb372/guess-the-country', 'passw0rd');
