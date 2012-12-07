var _ = require('underscore');

function Member(server, socket) {
  this.server = server;
  this.socket = socket;
  this.room = null;
  this.name = null;
  socket.on('disconnect', _.bind(this.onDisconnect, this));
  socket.on('login', _.bind(this.onLogin, this));
  socket.on('getroomlist', _.bind(this.onGetRoomList, this));
  socket.on('genroomid', _.bind(this.onGenRoomId, this));
  socket.on('enterroom', _.bind(this.onEnterRoom, this));
  socket.on('chatmessage', _.bind(this.onChatMessage, this));
}
Member.prototype.onDisconnect = function() {
  console.log('disconnect:', this.name);
  this.server.disconnection(this);
  if (this.room) {
    this.server.removeMember(this, this.room);
    this.room = null;
  }
};
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
  if (!fn) {
    return;
  }
  fn(this.server.newRoomName());
};
Member.prototype.onEnterRoom = function(data) {
  console.log('enterroom:'+data);
  if (!this.name || !data) {
    this.socket.disconnect();
    return;
  }
  if (this.room !== null) {
    this.socket.emit('error', {
      errno: 'EROOM',
      event: 'enterroom',
      data: data
    });
    return;
  }
  var room = this.server.getRoom(data);
  if (!room) {
    this.socket.emit('error', {
      errno: 'ENOENT',
      event: 'enterroom',
      data: data
    });
    return;
  }
  this.room = room;
  this.socket.join(room.getName());
  this.socket.emit('enter', {
    room: room.getName(),
    members: _.map(this.server.getMemberList(), function(member) { return member.name; })
  });
  this.server.addMember(this, this.room);
};
Member.prototype.onChatMessage = function(data) {
  console.log('chatmessage:'+data);
  if (!this.name) {
    this.socket.disconnect();
    return;
  }
  if (!this.room) {
    this.socket.emit('error', {
      errno: 'EROOM',
      event: 'chatmessage',
      data: data
    });
    return;
  }
  this.server.chatMessage(this, data);
};
Member.prototype.sendRoomList = function() {
  var rooms = _.map(this.server.getRoomList(), function(room) { return room.getName(); });
  this.socket.emit('roomlist', rooms);
};
Member.prototype.addMember = function(member) {
  this.socket.emit('addmember', member.name);
};
Member.prototype.removeMember = function(member) {
  this.socket.emit('removemember', member.name);
};
Member.prototype.sendChatMessage = function(member, data) {
  this.socket.emit('chatmessage', {
    name: member.name,
    message: data
  });
};

module.exports = Member;
