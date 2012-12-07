exports.start = function(port) {
  var _ = require('underscore');
  var server = require('./server').start(port);
  var room = require('./room');
  var Member = require('./member');
  var memberlist = [];
  var roomlist = new room.RoomList();
  for (var i = 0; i < 10; i++) {
    roomlist.createRoom();
  }

  server.io.sockets.on('connection', function(socket) {
    memberlist.push(new Member(server, socket));
  });
  server.disconnection = function(member) {
    var index = _.indexOf(memberlist, member);
    if (index >= 0) {
      memberlist.splice(index, 1);
    }
  };
  server.getRoomList = function() {
    return roomlist.rooms.slice(0);
  };
  server.newRoomName = function() {
    return roomlist.newRoomName();
  };
  server.getRoom = function(name) {
    return roomlist.getRoom(name);
  };
  server.getMemberList = function() {
    return memberlist.slice(0);
  };
  server.addMember = function(member, room) {
    _.each(memberlist, function(m) {
      if (m !== member && m.room === room) {
        m.addMember(member);
      }
    });
  };
  server.removeMember = function(member, room) {
    _.each(memberlist, function(m) {
      if (m !== member && m.room === room) {
        m.removeMember(member);
      }
    });
  };
  server.chatMessage = function(member, message) {
    _.each(memberlist, function(m) {
      if (!member || m.room === member.room) {
        m.sendChatMessage(member, message);
      }
    });
  };
}

exports.start(process.env.PORT || 60726);
