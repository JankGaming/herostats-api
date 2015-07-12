var connection = require('../lib/mysqlConnector');
var config = require('../config.json');
var table = config.mysqlTable;

var patchList = require('../data/patches.json');
var logger = require('graceful-logger');
logger.format('medium');

module.exports = function(app) {
  app.get('/heroes/:hero', singleHero);
  app.get('/patch/:patchNumber', patchData);
  app.get('/heroes', heroList);
};

// Return data from the given hero.
var singleHero = function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');

  // Get the user ID from the request.
  var hero = req.params.hero;

  // Alias 'all' to be the list of all heroes.
  if (hero === 'all') {
    returnAll(req, res);
    return;
  }

  // If its a number, serve by ID. Otherwise serve by name.
  if (hero % 1 === 0) {

    // Query the database for the given hero ID.
    connection.query('SELECT * FROM `' + table + '` WHERE ID = ? ORDER BY ID DESC LIMIT 1',
    [hero],
    function(err, rows) {

      // Throw the error if there is one.
      if (err) {
        logger.err(err);
        logger.err('FAILED TO FILL REQUEST: hero - ' + hero);
        res.json({error: 'Internal error.'});
      } else if(rows.length > 0) {
        logger.info('SUCCESSFULLY FILLED REQUEST: hero - ' + hero);
        res.json(rows[0]);
      } else {
        logger.info('EMPTY RESPONSE - ' + hero);
        res.json({error: 'Hero not found.'});
      }
    });

  } else {

  // Query the database for the given hero name.
  connection.query('SELECT * FROM `' + table + '` WHERE Name = ? ORDER BY ID DESC LIMIT 1',
    [hero],
    function(err, rows) {

      // Throw the error if there is one.
      if (err) {
        logger.err(err);
        logger.err('FAILED TO FILL REQUEST - hero - ' + hero);
        res.json({error: 'Internal error.'});
      } else if(rows.length > 0) {
        logger.info('SUCCESSFULLY FILLED REQUEST - hero - ' + hero);
        res.json(rows[0]);
      } else {
        logger.info('EMPTY RESPONSE - ' + hero);
        res.json({error: 'Hero not found.'});
      }
    });

  }
};

var patchData = function(req, res) {
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
};

// Return the list of hero/id pairings.
var heroList = function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');

  // Query the database
  connection.query('SELECT ID, Name FROM `' + table + '` WHERE 1 ORDER BY ID ASC',
    function(err, rows) {

      // Throw the error if there is one.
      if (err) {
        logger.err(err);
        logger.err('FAILED TO FILL REQUEST - HERO LIST');
        res.json({error: 'Internal error.'});
      } else if(rows.length > 0) {
        logger.info('SUCCESSFULLY FILLED REQUEST - HERO LIST');
        var respondObj = {};

        for (var i = 0; i < rows.length; i++) {
          var thisID = rows[i].ID;
          var thisHero = rows[i].Name;
          respondObj[thisID] = thisHero;
        }

        res.json(respondObj);
      } else {
        logger.info('EMPTY RESPONSE - HERO LIST');
        res.json({error: 'No response from database.'});
      }
    });
};

/*******************************************************************************
 * BEGIN HELPER FUNCTIONS
 ******************************************************************************/

function returnAll(req, res, tableOverride) {

  var useTable = table;

  if (typeof tableOverride !== 'undefined') {
    useTable = tableOverride;
  }

  // Query the database
  connection.query('SELECT * FROM `' + useTable + '` WHERE 1 ORDER BY ID ASC',
    function(err, rows) {

      // Throw the error if there is one.
      if (err) {
        logger.info(err);
        logger.info('FAILED TO FILL REQUEST - ALL HEROES - ' + useTable);
        res.json({error: 'Internal error.'});
      } else if(rows.length > 0) {
        logger.info('SUCCESSFULLY FILLED REQUEST - ALL HEROES - ' + useTable);
        var respondObj = {};

        for (var i = 0; i < rows.length; i++) {
          respondObj[rows[i].ID] = rows[i];
        }

        res.json(respondObj);
      } else {
        logger.info('EMPTY RESPONSE -  ALL HEROES');
        res.json({error: 'No response from database.'});
      }
    });
}

