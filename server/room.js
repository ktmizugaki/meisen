var events = require('events');
var util = require('util');
var _ = require('underscore');

function Room(options) {
  events.EventEmitter.call(this);
  this.options = {};
  _.defaults(this.options, options, Room.defualtOptions);
}
util.inherits(Room, events.EventEmitter);
Room.defualtOptions = {
  name: 'room'
, autoVanish: true
};
Room.prototype.getName = function() {
  return this.options.name;
};

function RoomList() {
  events.EventEmitter.call(this);
  this.id = 1000;
  this.rooms = [];
}
util.inherits(RoomList, events.EventEmitter);
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
