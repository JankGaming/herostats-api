var express = require('express');
var mysql = require('mysql');
var config = require('./config.json');
var logger = require('graceful-logger');
logger.format('medium');

var v1Routes = require('./routes/v1.js');

// Connect to the mySQL database.
var connection = mysql.createConnection({
  host         : config.host,
  user         : config.mysqlUser,
  password     : config.mysqlPassword,
  insecureAuth : true,
  database     : config.mysqlDatabase
});

connection.connect();
handleDisconnect(connection);

// Get table name.
var table = config.mysqlTable;
var patchName = config.patchName;

var app = express();
app.set('connection', connection);
app.set('table', table);
app.set('patchName', patchName);

/*******************************************************************************
 * BEGIN ROUTING
 ******************************************************************************/
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

// Just in case!
function handleDisconnect(connection) {
  connection.on('error', function(err) {
    if (!err.fatal) {
      return;
    }

    if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
      throw err;
    }

    logger.info('Re-connecting to database.');

    connection = mysql.createConnection(connection.config);
    connection.connect();
    handleDisconnect(connection);

  });
}

setInterval(keepAlive, 60000);

function keepAlive() {
  connection.query('SELECT 1');
}

/*******************************************************************************
 * END ROUTING
 ******************************************************************************/

app.set('port', config.port || 322);

var server = app.listen(app.get('port'), function() {
  logger.info('Herostats now running on port ' + server.address().port);
});

module.exports = app;
