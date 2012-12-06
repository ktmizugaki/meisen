exports.start = function(port) {
  var _ = require('underscore');
  var server = require('./server').start(port);
  var room = require('./room');
  var Member = require('./member');
  var members = [];
  var roomlist = new room.RoomList();
  for (var i = 0; i < 10; i++) {
    roomlist.createRoom();
  }

  server.io.sockets.on('connection', function(socket) {
    members.push(new Member(server, socket));
  });
  server.getRoomList = function() {
    return roomlist.rooms.slice(0);
  }
  server.newRoomName = function() {
    return roomlist.newRoomName();
  }
}
