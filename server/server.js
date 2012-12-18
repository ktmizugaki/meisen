function startServer(port) {
  var path = require('path');
  var express = require('express');
  var app = express();
  var server = require('http').createServer(app);
  var io = require('socket.io').listen(server);
  server.listen(port);
  //app.use(express.logger());
  app.use(express.favicon());
  app.use(express.static(path.dirname(__dirname) + '/client'));
  app.use(express.static(path.dirname(__dirname) + '/shared'));
  return { app: app, server: server, io: io };
}

exports.start = startServer;
