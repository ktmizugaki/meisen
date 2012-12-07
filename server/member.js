var _ = require('underscore');

function Member(server, socket) {
  this.server = server;
  this.socket = socket;
  this.room = null;
  this.name = null;
  socket.on('login', _.bind(this.onLogin, this));
  socket.on('getroomlist', _.bind(this.onGetRoomList, this));
  socket.on('genroomid', _.bind(this.onGenRoomId, this));
  socket.on('chatmessage', _.bind(this.onChatMessage, this));
}
Member.prototype.onLogin = function(data) {
  console.log('login:', data);
  if (data && data.name) {
    this.name = data.name;
    this.socket.emit('ready');
  } else {
    this.socket.disconnect();
  }
};
Member.prototype.onGetRoomList = function() {
  console.log('getroomlist');
  if (!this.name) {
    this.socket.disconnect();
    return;
  }
  this.sendRoomList();
};
Member.prototype.onGenRoomId = function(data, fn) {
  console.log('genroomid');
  if (!this.name) {
    this.socket.disconnect();
    return;
  }
  fn(this.server.newRoomName());
};
Member.prototype.onChatMessage = function(data) {
  console.log('chatmessage');
  if (!this.name) {
    this.socket.disconnect();
    return;
  }
  if (!this.room) {
    return;
  }
  this.server.ChatMessage(this, data);
};
Member.prototype.sendRoomList = function() {
  console.log(this.server.getRoomList());
  var rooms = _.map(this.server.getRoomList(), function(room) { return room.getName(); });
  this.socket.emit('roomlist', rooms);
};
Member.prototype.sendChatMessage = function(member, data) {
  this.socket.emit('chatmessage', {
    name: member.name,
    message: data
  });
};

module.exports = Member;
