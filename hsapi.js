var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var config = require('./config.json');

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

/*******************************************************************************
 * BEGIN ROUTING
 ******************************************************************************/
app.get('/', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  var welcomeMsg = "<!DOCTYPE html>"
  + "<div style='font-family: \"Courier New\"'>"
  + "Welcome to the JankDota Hero Stats API!<br />"
  + "Currently serving stats for patch " + patchName + "<br />"
  + "To get JSON of all hero/ID pairs, query http://api.herostats.io/heroes<br />"
  + "To get the JSON for a single hero, query http://api.herostats.io/heroes/<strong>heroname</strong><br />"
  + "Alternatively, you can query with the JankDota HeroID with http://api.herostats.io/heroes/<strong>heroID</strong><br />"
  + "<strong>To get ALL hero data in one query</strong>, use http://api.herostats.io/heroes/all<br /><br />"
  + "This API is here to help you easily access Dota 2 hero properties. If you are implementing the API, please use intelligent code "
  + "for getting the hero data as to not destroy the server with requests! Besides that, this data is free and open to use by anyone.<br /><br />"
  + "See <a target=\"_blank\" href=\"http://jankdota.com/herostats\">jankdota.com/herostats</a> for our in-depth display of all hero property data."
  + "</div>";
  res.send(welcomeMsg);
  res.end();
  console.info("SERVED - Homepage");
  return;
});

// Return data from the given hero.
app.get('/heroes/:hero', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");

  // Get the user ID from the request.
  var hero = req.params.hero;

  // Alias 'all' to be the list of all heroes.
  if (hero == "all") {
    returnAll(req, res);
    return;
  }

  // If its a number, serve by ID. Otherwise serve by name.
  if (hero % 1 === 0) {

    // Query the database for the given hero ID.
    connection.query("SELECT * FROM `" + table + "` WHERE ID = ? ORDER BY ID DESC LIMIT 1",
    [hero],
    function(err, rows, fields) {

      // Throw the error if there is one.
      if (err) {
        console.error(err);
        console.error("FAILED TO FILL REQUEST: hero - " + hero);
        res.json({error: "Internal error."});
      } else if(rows.length > 0) {
        console.info("SUCCESSFULLY FILLED REQUEST: hero - " + hero);
        var respondObj = {};
        res.json(rows[0]);
      } else {
        console.info("EMPTY RESPONSE - " + hero);
        res.json({error: "Hero not found."});
      }
    });

  } else {

  // Query the database for the given hero name.
  connection.query("SELECT * FROM `" + table + "` WHERE Name = ? ORDER BY ID DESC LIMIT 1",
    [hero],
    function(err, rows, fields) {

      // Throw the error if there is one.
      if (err) {
        console.error(err);
        console.error("FAILED TO FILL REQUEST - hero - " + hero);
        res.json({error: "Internal error."});
      } else if(rows.length > 0) {
        console.info("SUCCESSFULLY FILLED REQUEST - hero - " + hero);
        var respondObj = {};
        res.json(rows[0]);
      } else {
        console.info("EMPTY RESPONSE - " + hero);
        res.json({error: "Hero not found."});
      }
    });

  }
});

// Return the list of hero/id pairings.
app.get('/heroes', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");

  // Query the database
  connection.query("SELECT ID, Name FROM `" + table + "` WHERE 1 ORDER BY ID ASC",
    function(err, rows, fields) {

      // Throw the error if there is one.
      if (err) {
        console.error(err);
        console.error("FAILED TO FILL REQUEST - HERO LIST");
        res.json({error: "Internal error."});
      } else if(rows.length > 0) {
        console.info("SUCCESSFULLY FILLED REQUEST - HERO LIST");
        var respondObj = {};

        for (var i = 0; i < rows.length; i++) {
          var thisID = rows[i].ID;
          var thisHero = rows[i].Name;
          respondObj[thisID] = thisHero;
        }

        res.json(respondObj);
      } else {
        console.info("EMPTY RESPONSE - HERO LIST");
        res.json({error: "No response from database."});
      }
    });
});

// Catch everything else.
app.get("*", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.json({error: 'Invalid request'});
});

/*******************************************************************************
 * BEGIN HELPER FUNCTIONS
 ******************************************************************************/

function returnAll(req, res) {

  // Query the database
  connection.query("SELECT * FROM `" + table + "` WHERE 1 ORDER BY ID ASC",
    function(err, rows, fields) {

      // Throw the error if there is one.
      if (err) {
        console.log(err);
        console.log("FAILED TO FILL REQUEST - ALL HEROES");
        res.json({error: "Internal error."});
      } else if(rows.length > 0) {
        console.log("SUCCESSFULLY FILLED REQUEST - ALL HEROES");
        var respondObj = {};

        for (var i = 0; i < rows.length; i++) {
          respondObj[rows[i].ID] = rows[i];
        }

        res.json(respondObj);
      } else {
        console.log("EMPTY RESPONSE -  ALL HEROES");
        res.json({error: "No response from database."});
      }
    });
}


// Just in case!
function handleDisconnect(connection) {
  connection.on('error', function(err) {
    if (!err.fatal) {
      return;
    }

    if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
      throw err;
    }

    console.log('Re-connecting to database.');

    connection = mysql.createConnection(connection.config);
    connection.connect();
    handleDisconnect(connection);

  });
}

setInterval(keepAlive, 60000);

function keepAlive() {
  connection.query("SELECT 1");
}

/*******************************************************************************
 * END ROUTING
 ******************************************************************************/

app.set('port', config.port || 322);

var server = app.listen(app.get('port'), function() {
  console.log('Herostats now running on port ' + server.address().port);
});

module.exports = app;
