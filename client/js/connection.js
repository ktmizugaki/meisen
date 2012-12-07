function Connection(client, name) {
  var socket = io.connect('http://'+location.host+'/', client.socketOptions);
  this.client = client;
  this.socket = socket;
  this.name = name;
  this.room = null;
  socket.on('connect', _.bind(this.onConnect, this));
  socket.on('disconnect', _.bind(this.onDisconnect, this));
  socket.on('ready', _.bind(this.onReady, this));
  socket.on('roomlist', _.bind(this.onRoomList, this));
  socket.on('enter', _.bind(this.onEnter, this));
  socket.on('addmember', _.bind(this.onAddMember, this));
  socket.on('removemember', _.bind(this.onRemoveMember, this));
  socket.on('chatmessage', _.bind(this.onChatMessage, this));
}

Connection.prototype.onConnect = function() {
  console.log('socket.connected');
  if (this.client.socket === this) {
    this.client.connected();
  }
};
Connection.prototype.onDisconnect = function() {
  console.log('socket.disconnected');
  if (this.client.socket === this) {
    this.client.reset();
  }
};
Connection.prototype.onReady = function() {
  console.log('socket.ready');
  if (this.client.socket === this) {
    this.client.ready();
  }
};
Connection.prototype.onRoomList = function(data) {
  console.log('socket.roomlist: ', data);
  if (this.client.socket === this && data && data.length) {
    this.client.roomlist(data);
  }
};
Connection.prototype.onEnter = function(data) {
  console.log('socket.enter: ', data);
  if (this.client.socket === this && data) {
    this.client.enter(data);
  }
};
Connection.prototype.onAddMember = function(data) {
  console.log('socket.addmember: ', data);
  if (this.client.socket === this && data) {
    this.client.addMember(data);
  }
};
Connection.prototype.onRemoveMember = function(data) {
  console.log('socket.removemember: ', data);
  if (this.client.socket === this && data) {
    this.client.removeMember(data);
  }
};
Connection.prototype.onChatMessage = function(data) {
  console.log('socket.chatmessage: ', data);
  if (this.client.socket === this && data) {
    this.client.chatmessage(data);
  }
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
Connection.prototype.enterRoom = function(roomid) {
  this.socket.emit('enterroom', roomid);
};
Connection.prototype.sendChat = function(message) {
  this.socket.emit('chatmessage', message);
};
