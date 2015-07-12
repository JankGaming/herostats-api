var config = require('./config.json');
var appGenerator = require('./lib/appGenerator');
var logger = require('graceful-logger');
logger.format('medium');

var app = appGenerator.generate();

app.set('port', config.port || 322);

var server = app.listen(app.get('port'), function() {
  logger.info('Herostats now running on port ' + server.address().port);
});

module.exports = app;
