var express = require('express');
var router = express.Router();
var controller = require('../lib/controller');

/* Root redirects to index page */
router.get('/', function(req, res) {
  res.redirect('/presentations/');
});

/* GET home page. */
router.get('/presentations/', function(req, res) {
	controller.loadIndexPage(res);
});

/* View a presentation */
router.get('/presentations/:id', function(req, res) {
  controller.viewPresentation(res, req.params.id, req.headers['user-agent']);
});

/* Show the password form for presenting a presentation */
router.get('/presentations/:id/present', function(req, res) {
  res.render('password-form', { });
});

/* Present a presentation */
router.post('/presentations/:id/present', function(req, res) {
  controller.presentPresentation(res, req.params.id, req.body.password, req.path, req.headers['user-agent']);
});

/* Add a presentation */
router.post('/presentations/', function(req, res) {
  controller.addPresentation(res, req.body.presId, req.body.url, req.body.password);
});

/* Publicize a presentation */
router.get('/presentations/:id/publicize', function(req, res) {
  var presentationUrl = req.protocol + '://' + req.headers.host + "/presentations/" + req.params.id;
  controller.showPublicizePage(res, req.params.id, presentationUrl);
});
module.exports = router;
