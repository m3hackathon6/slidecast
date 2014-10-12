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
}

/**
 * PresentationをRedisに保存する。
 *
 * @return 結果のPromise
 */
exports.save = function(presId, url, password) {
  var presenterKey = uuid.v4(); // 別にセキュアじゃなくていいからUUIDを使う
  var presentation = { presId: presId, url: url, password: password, presenterKey: presenterKey };
  var value = JSON.stringify(presentation);
  debug('Saving to Redis', value);
  return q.ninvoke(redisClient, 'set', presId2redisKey(presId), value);
}

// Uncomment this to insert dummy data into Redis
//exports.save('123', 'http://vizzuality.github.io/rollingstonesmap/', 'super-secret');
