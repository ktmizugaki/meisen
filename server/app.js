exports.start = function(port) {
  var _ = require('underscore');
  var server = require('./server').start(port);
  var room = require('./room');
  var Member = require('./member');
  var memberlist = [];
  var membernames = {};
  var roomlist = new room.RoomList();
  for (var i = 0; i < 10; i++) {
    roomlist.createRoom();
  }

  server.io.disable('log');
  server.io.sockets.on('connection', function(socket) {
    memberlist.push(new Member(server, socket));
  });
  server.getRoomList = function() {
    return roomlist.rooms.slice(0);
  };
  server.getRoom = function(name) {
    return roomlist.getRoom(name);
  };
  server.getMemberList = function() {
    return memberlist.slice(0);
  };
  server.getMember = function(name) {
    if (_.has(membernames, name)) {
      return membernames[name];
    }
    return null;
  };

  /* Member Event */
  server.onLogin = function(member, name) {
    membernames[name] = member;
  };
  server.onDisconnect = function(member, name) {
    member.removeListener(this);
    var index = _.indexOf(memberlist, member);
    if (index >= 0) {
      memberlist.splice(index, 1);
    }
    if (name !== null) {
      delete membernames[name];
    }
  };
  server.onGetRoomList = function(member) {
    var rooms = _.map(roomlist.rooms, function(room) { return room.getName(); });
    member.sendRoomList(rooms);
  };
  server.onGenRoomId = function(member, fn) {
    if (!fn) {
      return;
    }
    fn(roomlist.newRoomName());
  };
  server.onCreateRoom = function(member, data) {
    var room = roomlist.createRoom(data);
    var rooms = _.map(roomlist.rooms, function(room) { return room.getName(); });
    _.each(memberlist, function(member) {
      member.sendRoomList(rooms);
    });
  };
}

exports.start(process.env.PORT || 60726);
