var _ = require('underscore');
var Meisen = require('./meisen');

function Room(options) {
  this.options = {};
  this.members = [];
  this.players = [null, null, null, null];
  _.defaults(this.options, options, Room.defualtOptions);
  this.initMeisen();
}
Room.defualtOptions = {
  name: 'room',
  autoVanish: true,
};
Room.prototype.initMeisen = function() {
  delete require.cache[require.resolve('./meisen')];
  Meisen = require('./meisen');
  this.meisen = new Meisen(_.bind(this.gameCallback, this));
};
Room.prototype.getName = function() {
  return this.options.name;
};
Room.prototype.getGameData = function() {
  return Meisen.meisenToData(this.meisen, Meisen.Target.all);
};
Room.playerReg = /player[0-3]/;
Room.prototype.gameCallback = function(data, game) {
  var checker = null;
  if (data.target == 'all') {
    checker = function(m) { return true; };
  } else if (data.target == 'other') {
    var players = this.players;
    checker = function(m) { return !_.contains(players, m.name); };
  } else if (data.target.match(Room.playerReg)) {
    var player = this.players[data.target.charAt('player'.length)];
    checker = function(m) { return player == m.name; };
  }
  if (checker) {
    _.each(this.members, function(m) {
      if (checker(m)) m.sendGameEvent(data);
    });
    return;
  }
};
/* Member Listener */
Room.prototype.setSeat = function(pos, member) {
  this.players[pos] = member.name;
  var data = {
    action: 'seat', target: 'all',
    pos: pos, name: member.name,
  };
  this.gameCallback(data, this.meisen);
};
Room.prototype.clearSeat = function(member) {
  for (var i = 0; i < 4; i++) {
    if (this.players[i] == member.name) {
      this.players[i] = null;
      var data = {
        action: 'seat', target: 'all',
        pos: i, name: null,
      };
      this.gameCallback(data, this.meisen);
    }
  }
};
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
  this.clearSeat(member);
};
Room.prototype.onDisconnect = function(member, name) {
  this.removeMember(member);
};
Room.prototype.onEnterRoom = function(member) {
  this.addMember(member);
  var members = _.map(this.members, function(m) { return m.serialize(); });
  member.sendMemberList(members);
  var players = { action: 'seat' };
  _.each(this.players, function(p, i) { players[i] = p; }, this);
  member.sendPlayers(players);
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
  if (data.action == 'seat') {
    var pos = data.pos;
    if (pos !== 0 && pos !== 1 && pos !== 2 && pos !== 3) {
      return false;
    }
    if (this.players[pos] !== null) {
      return false;
    }
    this.clearSeat(member);
    this.setSeat(pos, member);
    member.sendGameEvent(Meisen.meisenToData(this.meisen, Meisen.Target.PLAYERS[pos]));
    return true;
  }
  if (!this.meisen) {
    return false;
  }
  if (!_.has(this.players, data.player)) {
    console.log('invalid player id:', data.player, this.players[data.player], member.name);
    return;
  }
  if (this.players[data.player] !== member.name) {
    console.log('wrong player:', data.player, this.players[data.player], member.name);
    return;
  }
  if (data.action == 'init') {
    this.initMeisen();
  }
  return this.meisen.onData(data);
};

function RoomList() {
  this.id = 1000;
  this.rooms = [];
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
  this.rooms.push(new Room(options));
  return true;
};
RoomList.prototype.getRoom = function(name) {
  return _.find(this.rooms, function(room) { return room.getName() === name; });
}

exports.Room = Room;
exports.RoomList = RoomList;
