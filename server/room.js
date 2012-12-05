var events = require('events');
var util = require('util');
var _ = require('underscore');

function Room(options) {
    events.EventEmitter.call(this);
    this.name = options.name || 'room';
}
util.inherits(Room, events.EventEmitter);

function RoomList() {
    events.EventEmitter.call(this);
    this.id = 1000;
    this.rooms = [];
}
RoomList.prototype.newRoomName = function() {
    return "room"+(++this.id);
};
RoomList.prototype.createRoom = function(options) {
    options.name = options.name || this.newRoomName();
    var room = this.getRoom(options.name);
    if (room) {
        return false;
    }
    this.rooms.add(new Room(options));
    return true;
};
RoomList.prototype.getRoom = function(name) {
    return _.find(this.rooms, function(room) { return room.name === name; });
}

util.inherits(RoomList, events.EventEmitter);

exports.Room = Room;
exports.RoomList = RoomList;
