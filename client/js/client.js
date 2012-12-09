var client = (function(){
  var client = {};
  var meisen = new MeisenUI();
  client.paper = null;
  client.name = null;
  client.socket = null;
  client.socketOptions = {
    'try multiple transports': false,
    'force new connection': true,
    reconnect: false
  };
  client.setActive = function(id) {
    $('article').removeClass('on').addClass('off');
    if (id) {
      $(id).removeClass('off').addClass('on');
    }
  };
  client.init = function() {
    client.setActive('#login');
    $(document).on('click', 'a.button', function(e) {
      e.preventDefault();
      return false;
    });
    $(document).on('submit', 'form', function(e) {
      e.preventDefault();
      return false;
    });
    $('#form-login').submit(function() {
      client.connect();
      return false;
    });
    $('#button-login').click(function() {
      client.connect();
      return false;
    });
    $('#button-newroom').click(function() {
      client.prepareRoom();
      return false;
    });
    $('#button-roomlist').click(function() {
      client.loadRoomList();
      return false;
    });
    $(document).on('click', '#list-room .room', function(){
      client.enterRoom($(this).attr('roomid'));
      return false;
    });
    $('#form-chat').submit(function() {
      client.sendChat(this);
      return false;
    });
  };
  client.connect = function() {
    if (client.socket !== null) {
      return false;
    }
    $('#state-login').html('接続中……');
    try {
      client.socket = new Connection(client, $('#name-login')[0].value);
    } catch(e) {
      client.socket = null;
      $('#state-login').html('<span class="error">接続できません</span>');
    }
  };
  client.connected = function() {
    $('#state-login').html('接続済');
    client.login();
  };
  client.reset = function() {
    client.setActive('#login');
    if (client.socket !== null) {
        client.socket.disconnect();
    }
    client.name = null;
    client.socket = null;
    $('#state-login').html('未接続');
  };
  client.login = function() {
    if (client.socket !== null && client.name === null) {
      client.name = client.socket.name;
      client.socket.login(client.name);
    }
  };
  client.loadRoomList = function() {
    if (client.socket !== null) {
      client.socket.getRoomList();
    }
  };
  client.prepareRoom = function() {
    if (client.socket !== null) {
      client.socket.genRoomId(function (data) {
        console.log('genRoomId:'+data);
        client.roomid = data;
      });
    }
  };
  client.enterRoom = function(roomid) {
    if (client.socket !== null) {
      client.socket.enterRoom(roomid);
    }
  };
  client.sendChat = function(form) {
    if (client.socket !== null) {
      $input = $('#chat-room', form);
      client.socket.sendChat($input.val());
      $input.val("");
    }
  };
  client.sendGameEvent = function(data) {
    if (client.socket !== null) {
      client.socket.socket.emit('game', data);
    }
  }

  client.ready = function() {
    client.setActive('#roomlist');
    client.loadRoomList();
  }
  client.roomlist = function(list) {
    var $div = $('#list-room');
    $div.empty();
    _.each(list, function(room) {
      $div.append($('<a href="" class="room button"></a>').attr('roomid', room).text(room));
    });
  };
  client.enter = function(roominfo) {
    client.setActive('#room');
    $('#room #roomname').text(roominfo.name);
    var $div = $('#room-name-list');
    $div.empty();
    _.each(roominfo.members, function(member) {
      $div.append($('<div class="member"></div>').attr('memberid', member).text(member));
    });
    $('#room #chat').empty();
    meisen.reset();
  };
  client.addMember = function(member) {
    $('#room-name-list').append($('<div class="member"></div>').attr('memberid', member).text(member));
  };
  client.removeMember = function(member) {
    $('#room-name-list .member').each(function(){
      if ($(this).attr('memberid') === member) {
        $(this).remove();
        return true;
      }
    });
  };
  client.chatmessage = function(chat) {
    if (chat && chat.name && chat.message) {
      var $div = $('#chat');
      $div.append($('<div class="message"></div>').text(chat.name+': '+chat.message));
    }
  };
  client.gamedata = function(data) {
    meisen.onData(data);
  };

  $(document).ready(function(){
    $('#svg-cards')[0].addEventListener('load', function(){
      client.init();
      meisen.init();
    }, false);
  });

  return client;
})();
