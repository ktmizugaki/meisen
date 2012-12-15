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
  socket.on('game', _.bind(this.onGameEvent, this));
}
Member.prototype.onDisconnect = function() {
  this.server.disconnection(this);
  if (this.room) {
    this.server.removeMember(this, this.room);
    this.room = null;
  }
};
Member.prototype.onLogin = function(data) {
  if (data && data.name) {
    this.name = data.name;
    this.socket.emit('ready');
  } else {
    this.socket.disconnect();
  }
};
Member.prototype.onGetRoomList = function() {
  if (!this.name) {
    this.socket.disconnect();
    return;
  }
  this.sendRoomList();
};
Member.prototype.onGenRoomId = function(data, fn) {
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
  this.sendGameEvent(this.room.getGameData());
};
Member.prototype.onChatMessage = function(data) {
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
Member.prototype.onGameEvent = function(data) {
  if (!this.room) {
    this.socket.emit('error', {
      errno: 'EROOM',
      event: 'chatmessage',
      data: data
    });
    return;
  }
  this.room.onGameData(data);
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
Member.prototype.sendGameEvent = function(data) {
  this.socket.emit('game', data);
};

module.exports = Member;
