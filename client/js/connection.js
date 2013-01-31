function Connection(client, name) {
  var socket = io.connect(location.protocol+'//'+location.host+'/', client.socketOptions);
  this.client = client;
  this.socket = socket;
  this.name = name;
  this.room = null;
  socket.on('connect', _.bind(this.onConnect, this));
  socket.on('disconnect', _.bind(this.onDisconnect, this));
  socket.on('ready', _.bind(this.onReady, this));
  socket.on('roomlist', _.bind(this.onRoomList, this));
  socket.on('enter', _.bind(this.onEnter, this));
  socket.on('leave', _.bind(this.onLeave, this));
  socket.on('memberlist', _.bind(this.onMemberList, this));
  socket.on('addmember', _.bind(this.onAddMember, this));
  socket.on('removemember', _.bind(this.onRemoveMember, this));
  socket.on('chatmessage', _.bind(this.onChatMessage, this));
  socket.on('game', _.bind(this.onGame, this));
}

Connection.prototype.onConnect = function() {
  if (this.client.socket === this) {
    this.client.connected();
  }
};
Connection.prototype.onDisconnect = function() {
  if (this.client.socket === this) {
    this.client.reset();
  }
};
Connection.prototype.onReady = function() {
  if (this.client.socket === this) {
    this.client.ready();
  }
};
Connection.prototype.onRoomList = function(data) {
  if (this.client.socket === this && data && data.length) {
    this.client.roomList(data);
  }
};
Connection.prototype.onEnter = function(data) {
  if (this.client.socket === this && data) {
    this.client.enter(data);
  }
};
Connection.prototype.onLeave = function() {
  if (this.client.socket === this) {
    this.client.leave();
  }
};
Connection.prototype.onMemberList = function(data) {
  if (this.client.socket === this && data) {
    this.client.memberList(data);
  }
};
Connection.prototype.onAddMember = function(data) {
  if (this.client.socket === this && data) {
    this.client.addMember(data);
  }
};
Connection.prototype.onRemoveMember = function(data) {
  if (this.client.socket === this && data) {
    this.client.removeMember(data);
  }
};
Connection.prototype.onChatMessage = function(data) {
  if (this.client.socket === this && data) {
    this.client.chatmessage(data);
  }
};
Connection.prototype.onGame = function(data) {
  this.client.gamedata(data);
};

Connection.prototype.login = function(name) {
  this.socket.emit('login', { name: name });
};
Connection.prototype.disconnect = function(name) {
  this.socket.disconnect();
};
Connection.prototype.getRoomList = function() {
  this.socket.emit('getroomlist');
};
Connection.prototype.genRoomId = function(fn) {
  this.socket.emit('genroomid', '', fn);
};
Connection.prototype.createRoom = function(data) {
  this.socket.emit('createroom', data);
};
Connection.prototype.enterRoom = function(roomid) {
  this.socket.emit('enterroom', roomid);
};
Connection.prototype.leaveRoom = function() {
  this.socket.emit('leaveroom');
};
Connection.prototype.sendChat = function(message) {
  this.socket.emit('chatmessage', message);
};
