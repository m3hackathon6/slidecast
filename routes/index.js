var express = require('express');
var router = express.Router();
var presentations = require('../lib/presentations');
var request = require('request');
var q = require('q');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

/* View a presentation */
router.get('/presentations/:id', function(req, res) {
  presentations.findById(req.params.id)
    .then(function(presentation) {
      if (!presentation) {
        res.status(404);
      } else {
        // TODO move all this into a service
        request(presentation.url, function(error, response, body) {
          // TODO make this slightly less hacky
          var injectedStuff = '<a id="slidecast-data" data-pres-id="' + presentation.presId + '"></a><script src="/socket.io/socket.io.js"></script><script src="/javascripts/slidecast.slideshare.js"></script>';
          var bodyWithInjection = body.replace("</body>", injectedStuff + "</body>");
          res.send(bodyWithInjection);
        });
      }
    });
});

router.get('/presentations/:id/present', function(req, res) {
  res.render('password-form', { });
});

/* Present a presentation */
router.post('/presentations/:id/present', function(req, res) {
  presentations.findById(req.params.id)
    .then(function(presentation) {
      if (!presentation) {
        res.status(404);
      } else {
        if (req.body.password != presentation.password) {
          // Redirect back to password form
          res.redirect(req.path);
        } else {
          // TODO move all this into a service
          request(presentation.url, function(error, response, body) {
            // TODO make this slightly less hacky
            var injectedStuff = '<a id="slidecast-data" data-pres-id="' + presentation.presId + '" data-presenter="true" data-presenter-key="' + presentation.presenterKey + '"></a><script src="/socket.io/socket.io.js"></script><script src="/javascripts/slidecast.slideshare.js"></script>';
            var bodyWithInjection = body.replace("</body>", injectedStuff + "</body>");
            res.send(bodyWithInjection);
          });
        }
      }
    });
});

module.exports = router;
