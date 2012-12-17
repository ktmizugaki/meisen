var _ = require('underscore');
var Meisen = require('./meisen');

function Room(options) {
  this.options = {};
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
Room.prototype.onGameData = function(data) {
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
