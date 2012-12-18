var _ = require('underscore');
var Meisen = require('./meisen');

function Room(options) {
  this.options = {};
  this.members = [];
  this.meisen = new Meisen(_.bind(this.gameCallback, this));
  _.defaults(this.options, options, Room.defualtOptions);
  this.roomCallback = this.options.roomCallback;
}
Room.defualtOptions = {
  name: 'room',
  autoVanish: true,
};
Room.prototype.getName = function() {
  return this.options.name;
};
Room.prototype.getGameData = function() {
  return Meisen.meisenToData(this.meisen, Meisen.Target.all);
};
Room.prototype.gameCallback = function(data, game) {
  this.roomCallback(this, data);
};
/* Member Listener */
Room.prototype.addMember = function(member) {
  var index = -1;
  _.each(this.members, function(m) {
    if (m === member) {
      index = i;
    }
    m.addMember(member);
  });
  if (index < 0) {
    this.members.push(member);
  }
};
Room.prototype.removeMember = function(member) {
  var index = -1;
  _.each(this.members, function(m, i) {
    if (m === member) {
      index = i;
    }
    m.removeMember(member);
  });
  member.removeListener(this);
  if (index >= 0) {
    this.members.splice(index, 1);
  }
};
Room.prototype.onDisconnect = function(member, name) {
  this.removeMember(member);
};
Room.prototype.onEnterRoom = function(member) {
  this.addMember(member);
  var members = _.map(this.members, function(m) { return m.serialize(); });
  member.sendMemberList(members);
  if (this.meisen) {
    member.sendGameEvent(this.getGameData());
  }
};
Room.prototype.onLeaveRoom = function(member) {
  this.removeMember(member);
};
Room.prototype.onChatMessage = function(member, message) {
  _.each(this.members, function(m, i) {
    m.sendChatMessage(member, message);
  });
};
Room.prototype.onGameEvent = function(member, data) {
  if (!this.meisen) {
    return false;
  }
  if (data.action == 'init') {
    delete require.cache[require.resolve('./meisen')];
    Meisen = require('./meisen');
    this.meisen = new Meisen(_.bind(this.gameCallback, this));
  }
  return this.meisen.onData(data);
};
Room.prototype.gameCallback = function(data, game) {
  this.roomCallback(this, data);
};

function RoomList(roomCallback) {
  this.id = 1000;
  this.rooms = [];
  this.roomCallback = roomCallback;
}
RoomList.prototype.newRoomName = function() {
  return "room"+(++this.id);
};
RoomList.prototype.createRoom = function(options) {
  if (!options) options = {};
  options.name = options.name || this.newRoomName();
  var room = this.getRoom(options.name);
  if (room) {
    return false;
  }
  options.roomCallback = options.roomCallback || this.roomCallback;
  this.rooms.push(new Room(options));
  return true;
};
RoomList.prototype.getRoom = function(name) {
  return _.find(this.rooms, function(room) { return room.getName() === name; });
}

exports.Room = Room;
exports.RoomList = RoomList;
