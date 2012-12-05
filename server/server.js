function startServer (port) {
    var app = require('express')();
    var server = require('http').createServer(app);
    var io = require('socket.io').listen(server);
    server.listen(port);
    return { app: app, server: server, io: io };
}

exports.start = startServer;
