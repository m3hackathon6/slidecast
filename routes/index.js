var express = require('express');
var router = express.Router();
var controller = require('../lib/controller');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
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

module.exports = router;
