exports.start = function(port) {
  var express = require('express');
  var server = require('./server').start(port);
  var room = require('./room');
  var members = [];
  var roomlist = new room.RoomList();

  server.io.sockets.on('connection', function(socket) {
    socket.emit('mymsg', { hello: 'world' });
    socket.on('login', function(data) {
      socket.set('name', name, function () { socket.emit('ready'); });
    });
    socket.on('genroomid', function(data, fn) {
      fn(roomlist.newRoomName());
    });
  });
  server.app.use(express.logger());
  server.app.use(express.favicon());
  server.app.use(express.static(__dirname + '/public'));
}
