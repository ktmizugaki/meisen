var _ = require('underscore');

function Member(server, socket) {
  this.server = server;
  this.socket = socket;
  this.room = null;
  this.name = null;
  socket.on('login', _.bind(this.onLogin, this));
  socket.on('getroomlist', _.bind(this.onGetRoomList, this));
  socket.on('genroomid', _.bind(this.onGenRoomId, this));
}
Member.prototype.onLogin = function(data) {
  if (data && data.name) {
    this.name = data.name;
    this.socket.emit('ready');
  } else {
    this.socket.disconnect();
  }
};
Member.prototype.onGetRoomList = function() {
  if (this.name) {
    this.sendRoomList();
  }
};
Member.prototype.onGenRoomId = function(data, fn) {
  if (this.name) {
    fn(this.server.newRoomName());
  }
};
Member.prototype.sendRoomList = function() {
  var rooms = _.map(this.server.getRoomList(), function(room) { return room.name; });
  this.socket.emit('roomlist', rooms);
};

module.exports = Member;
