var express = require('express');
var v1Routes = require('../routes/v1.js');
var config = require('../config.json');
var logger = require('graceful-logger');
var patchName = config.patchName;
logger.format('medium');

exports.generate = function() {

  var app = express();

  app.get('/', function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    var welcomeMsg = '<!DOCTYPE html>' +
      '<div style=\'font-family: "Courier New"\'>' +
      'Welcome to the JankDota Hero Stats API!<br />'+
      'Current default patch: <strong>' + patchName + '</strong><br /><br />'+
      'JSON of all hero/ID pairs: http://api.herostats.io/heroes<br />' +
      'Single hero data: http://api.herostats.io/heroes/<strong>heroname (or hero ID*)</strong><br />' +
      'ALL hero data: http://api.herostats.io/heroes/all<br />' +
      'ALL hero data for past patches: http://api.herostats.io/patch/<strong>patch number</strong><br />' +
      '<em>Giving an incorrect patch number will return a list of valid patch numbers. ' +
      'HeroStats supports patches back to 6.77.</em><br /><br />' +
      'This API is here to help you easily access Dota 2 hero properties. If you are implementing the API, ' +
      'please use intelligent code for getting the hero data as to not destroy the server with requests! Besides that, ' +
      'this data is free and open to use by anyone.<br /><br />' +
      'See <a target="_blank" href="http://jankdota.com/herostats">jankdota.com/herostats</a> for our in-depth display ' +
      'of all hero property data.<br /><br />' +
      'See our <a href="https://github.com/JankGaming/herostats-api">Github repository</a><br /><br />' +
      'Version 2 is in development with hero leveling, filtering options and more.<br /><br />' +
      '<em>*JankDota hero ID from /heroes, not Valve API hero id</em>' +
      '</div>';
    res.send(welcomeMsg);
    res.end();
    logger.info('SERVED - Homepage');
    return;
  });

  v1Routes(app);

  // Catch everything else.
  app.get('*', function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(404).json({error: 'Invalid request'});
  });

  return app;

};
