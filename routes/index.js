var express = require('express');
var router = express.Router();
var controller = require('../lib/controller');

/* GET home page. */
router.get('/', function(req, res) {
	controller.loadIndexPage(res);
});

/* View a presentation */
router.get('/presentations/:id', function(req, res) {
  controller.viewPresentation(res, req.params.id);
});

/* Show the password form for presenting a presentation */
router.get('/presentations/:id/present', function(req, res) {
  res.render('password-form', { });
});

/* Present a presentation */
router.post('/presentations/:id/present', function(req, res) {
  controller.presentPresentation(res, req.params.id, req.body.password, req.path);
});

/* Add a presentation */
router.post('/presentations/', function(req, res) {
  var body = req.protocol + '://' + req.headers.host + req.url;
  controller.addPresentation(res, req.body.presId, req.body.url, req.body.password, body);
});

/* Show QR Code */
router.get('/qrCode/:id', function(req, res) {
  var body = req.protocol + '://' + req.headers.host + "/presentations/";
  controller.showQRCode(res, req.params.id, body);
});
module.exports = router;
