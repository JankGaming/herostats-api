var mysql = require('mysql');
var config = require('../config.json');

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

function keepAlive() {
  connection.query('SELECT 1');
}

setInterval(keepAlive, 60000);

module.exports = connection;
