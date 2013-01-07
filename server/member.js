var _ = require('underscore');
var sanitizer = require('sanitizer');

function Member(server, socket) {
  this.server = server;
  this.socket = socket;
  this.room = null;
  this.name = null;
  this._listeners = [];
  socket.on('disconnect', _.bind(this.onDisconnect, this));
  socket.on('login', _.bind(this.onLogin, this));
  socket.on('getroomlist', _.bind(this.onGetRoomList, this));
  socket.on('genroomid', _.bind(this.onGenRoomId, this));
  socket.on('createroom', _.bind(this.onCreateRoom, this));
  socket.on('enterroom', _.bind(this.onEnterRoom, this));
  socket.on('chatmessage', _.bind(this.onChatMessage, this));
  socket.on('game', _.bind(this.onGameEvent, this));
}
Member.prototype.serialize = function() {
  return this.name;
};
Member.prototype.disconnect = function() {
  if (this.socket) {
    this.socket.disconnect();
    this.socket = null;
  }
};
Member.prototype.validate = function(event) {
  if (event === 'onDisconnect') {
    return true;
  }
  if (this.disconnected) {
    return false;
  }
  if (this.name === null) {
    this.disconnect();
    return false;
  }
  return true;
};
Member.prototype.invokeListener = function(event, args) {
  if (!this.validate(event)) {
    return false;
  }
  var listeners = this._listeners.slice();
  for (var i = 0, l = listeners.length; i < l; i++) {
    var listener = listeners[i];
    if (typeof(listener[event])==='function') {
      listener[event](this, args);
    }
  }
  return true;
};
Member.prototype.addListener = function(listener) {
  this._listeners.push(listener);
};
Member.prototype.removeListener = function(listener) {
  for (var i = this._listeners.length-1; i >= 0; i--) {
    if (this._listeners[i] == listener) {
      this._listeners.splice(i, 1);
    }
  }
};
Member.prototype.onDisconnect = function() {
  this.disconnected = true;
  this.room = null;
  this.invokeListener('onDisconnect', this.name);
};
Member.checkNameReg = /^\s*$/;
Member.checkPassReg = /[^a-zA-Z0-9]/;
Member.prototype.onLogin = function(data) {
  if (this.name !== null || !data || !data.name) {
    this.disconnect();
    return;
  }
  var name = sanitizer.escape(sanitizer.sanitize(''+data.name));
  if (name.match(Member.checkNameReg)) {
    this.disconnect();
    return;
  }
  name = name.substring(0, 16);
  if (this.server.getMember(name) !== null) {
    this.disconnect();
    return;
  }
  this.name = name;
  this.addListener(this.server);
  this.socket.emit('ready');
  this.invokeListener('onLogin', data.name);
};
Member.prototype.onGetRoomList = function() {
  this.invokeListener('onGetRoomList', null);
};
Member.prototype.onGenRoomId = function(data, fn) {
  this.invokeListener('onGenRoomId', fn);
};
Member.prototype.onCreateRoom = function(data) {
  if (this.room !== null) {
    return;
  }
  if (!data) {
    return;
  }
  var options = {};
  options.name = sanitizer.escape(sanitizer.sanitize(''+data.name));
  options.pass = sanitizer.escape(sanitizer.sanitize(''+data.pass));
  if (options.name.match(Member.checkNameReg)) {
    console.log('create room: invalid name:', options.name);
    return;
  }
  if (options.pass.match(Member.checkPassReg)) {
    console.log('create room: invalid pass:', options.pass);
    return;
  }
  var room = this.server.getRoom(options.name);
  if (room) {
    console.log('create room: room exists:', options.name);
    return;
  }
  this.invokeListener('onCreateRoom', options);
  this.onEnterRoom(options.name);
};
Member.prototype.onEnterRoom = function(data) {
  if (this.room !== null) {
    return;
  }
  var room = this.server.getRoom(data);
  if (!room) {
    return;
  }
  this.room = room;
  this.addListener(room);
  this.socket.emit('enter', {
    room: room.getName(),
  });
  this.invokeListener('onEnterRoom', data);
};
Member.prototype.onChatMessage = function(data) {
  if (!this.room) {
    return;
  }
  data = sanitizer.escape(sanitizer.sanitize(''+data));
  this.invokeListener('onChatMessage', data);
};
Member.prototype.onGameEvent = function(data) {
  if (!this.room) {
    return;
  }
  this.invokeListener('onGameEvent', data);
};

Member.prototype.sendRoomList = function(rooms) {
  this.socket.emit('roomlist', rooms);
};
Member.prototype.sendMemberList = function(members) {
  this.socket.emit('memberlist', members);
};
Member.prototype.addMember = function(member) {
  this.socket.emit('addmember', member.serialize());
};
Member.prototype.removeMember = function(member) {
  this.socket.emit('removemember', member.serialize());
};
Member.prototype.sendChatMessage = function(member, data) {
  this.socket.emit('chatmessage', {
    member: member.serialize(),
    message: data
  });
};
Member.prototype.sendPlayers = function(players) {
  this.sendGameEvent(players);
};
Member.prototype.sendGameEvent = function(data) {
  console.log('send:', JSON.stringify(data));
  this.socket.emit('game', data);
};

module.exports = Member;
