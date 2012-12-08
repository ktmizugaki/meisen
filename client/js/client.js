var client = (function(){
  var client = {};
  var meisen = new Meisen();
  client.paper = null;
  client.name = null;
  client.socket = null;
  client.socketOptions = {
    'try multiple transports': false,
    reconnect: false
  };
  client.setActive = function(id) {
    $('article').removeClass('on').addClass('off');
    if (id) {
      $(id).removeClass('off').addClass('on');
    }
  };
  client.init = function() {
    console.log('init');
    client.setActive('#login');
    client.setActive('#room');
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
    console.log('connect');
    if (client.socket !== null) {
      console.log('connection is active');
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
    console.log('connected');
    $('#state-login').html('接続済');
    client.login();
  };
  client.reset = function() {
    console.log('reset');
    client.setActive('#login');
    if (client.socket !== null) {
        client.socket.disconnect();
    }
    client.name = null;
    client.socket = null;
    $('#state-login').html('未接続');
  };
  client.login = function() {
    console.log('login');
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

  $(document).ready(function(){
    client.init();
    meisen.init();
  });

  return client;
})();
