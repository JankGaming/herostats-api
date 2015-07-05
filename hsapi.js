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

var patchList = [
  '6.77',
  '6.78',
  '6.78c',
  '6.79',
  '6.80',
  '6.81',
  '6.81b',
  '6.82',
  '6.83',
  '6.83b',
  '6.83c',
  '6.84',
  '6.84b'
];

function tsLog(message) {
  var time = new Date().toString();
  console.log(time, message);
}

function tsErr(message) {
  var time = new Date().toString();
  console.error(time, message);
}

/*******************************************************************************
 * BEGIN ROUTING
 ******************************************************************************/
app.get('/', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  var welcomeMsg = "<!DOCTYPE html>"
  + "<div style='font-family: \"Courier New\"'>"
  + "Welcome to the JankDota Hero Stats API!<br />"
  + "Currently serving stats for patch <strong>" + patchName + "</strong><br /><br />"
  + "To get JSON of all hero/ID pairs, query http://api.herostats.io/heroes<br /><br />"
  + "To get the JSON for a single hero, query http://api.herostats.io/heroes/<strong>heroname</strong><br /><br />"
  + "Alternatively, you can query with the JankDota HeroID with http://api.herostats.io/heroes/<strong>heroID</strong><br /><br />"
  + "<strong>To get ALL hero data in one query</strong>, use http://api.herostats.io/heroes/all<br /><br />"
  + "<strong>To get ALL hero data for a given patch</strong>, use http://api.herostats.io/patch/<strong>patch number</strong><br />"
  + "<em>Giving an incorrect patch number will return a list of valid patch numbers. HeroStats supports patches back to 6.77.</em><br /><br />"
  + "This API is here to help you easily access Dota 2 hero properties. If you are implementing the API, please use intelligent code "
  + "for getting the hero data as to not destroy the server with requests! Besides that, this data is free and open to use by anyone.<br /><br />"
  + "See <a target=\"_blank\" href=\"http://jankdota.com/herostats\">jankdota.com/herostats</a> for our in-depth display of all hero property data."
  + "</div>";
  res.send(welcomeMsg);
  res.end();
  tsLog("SERVED - Homepage");
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
        tsErr(err);
        tsErr("FAILED TO FILL REQUEST: hero - " + hero);
        res.json({error: "Internal error."});
      } else if(rows.length > 0) {
        tsLog("SUCCESSFULLY FILLED REQUEST: hero - " + hero);
        var respondObj = {};
        res.json(rows[0]);
      } else {
        tsLog("EMPTY RESPONSE - " + hero);
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
        tsErr(err);
        tsErr("FAILED TO FILL REQUEST - hero - " + hero);
        res.json({error: "Internal error."});
      } else if(rows.length > 0) {
        tsLog("SUCCESSFULLY FILLED REQUEST - hero - " + hero);
        var respondObj = {};
        res.json(rows[0]);
      } else {
        tsLog("EMPTY RESPONSE - " + hero);
        res.json({error: "Hero not found."});
      }
    });

  }
});

app.get('/patch/:patchNumber', function(req, res) {
  var requestedPatch = req.params.patchNumber;

  if (patchList.indexOf(requestedPatch) === -1) {
    res.json({
      error: 'Invalid patch number',
      validPatches: patchList
    });
    return;
  }

   var patchLabel = requestedPatch.replace('.', '');
   returnAll(req, res, 'HeroStats_' + patchLabel);
});

// Return the list of hero/id pairings.
app.get('/heroes', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");

  // Query the database
  connection.query("SELECT ID, Name FROM `" + table + "` WHERE 1 ORDER BY ID ASC",
    function(err, rows, fields) {

      // Throw the error if there is one.
      if (err) {
        tsErr(err);
        tsErr("FAILED TO FILL REQUEST - HERO LIST");
        res.json({error: "Internal error."});
      } else if(rows.length > 0) {
        tsLog("SUCCESSFULLY FILLED REQUEST - HERO LIST");
        var respondObj = {};

        for (var i = 0; i < rows.length; i++) {
          var thisID = rows[i].ID;
          var thisHero = rows[i].Name;
          respondObj[thisID] = thisHero;
        }

        res.json(respondObj);
      } else {
        tsLog("EMPTY RESPONSE - HERO LIST");
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

function returnAll(req, res, tableOverride) {

  var useTable = table;

  if (typeof tableOverride !== 'undefined') {
    useTable = tableOverride;
  }

  // Query the database
  connection.query("SELECT * FROM `" + useTable + "` WHERE 1 ORDER BY ID ASC",
    function(err, rows, fields) {

      // Throw the error if there is one.
      if (err) {
        tsLog(err);
        tsLog("FAILED TO FILL REQUEST - ALL HEROES - " + useTable);
        res.json({error: "Internal error."});
      } else if(rows.length > 0) {
        tsLog("SUCCESSFULLY FILLED REQUEST - ALL HEROES - " + useTable);
        var respondObj = {};

        for (var i = 0; i < rows.length; i++) {
          respondObj[rows[i].ID] = rows[i];
        }

        res.json(respondObj);
      } else {
        tsLog("EMPTY RESPONSE -  ALL HEROES");
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

    tsLog('Re-connecting to database.');

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
  tsLog('Herostats now running on port ' + server.address().port);
});

module.exports = app;
