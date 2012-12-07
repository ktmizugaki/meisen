var client = (function(){
  var client = {};
  client.name = null;
  client.socket = null;
  client.socketOptions = {
    'try multiple transports': false,
    reconnect: false
  };
  client.init = function() {
    console.log('init');
    $('#form-login').submit(function() {
      client.connect();
      return false;
    });
    $('#button-login').click(function(e) {
      client.connect();
      return false;
    });
    $('#button-newroom').click(function(e) {
      client.prepareRoom();
      return false;
    });
    $('#button-roomlist').click(function(e) {
      client.loadRoomList();
      return false;
    });
    $(document).on('click', '#list-room .room', function(){
      console.log('click:'+ $(this).attr('roomid'));
      return false;
    });
  };
  client.connect = function() {
    console.log('connect');
    if (client.socket !== null) {
      console.log('connection is active');
      return false;
    }
    $('#state-login').html('<b>接続中</b>');
    client.socket = new Connection(client, $('#name-login')[0].value);
  };
  client.connected = function() {
    console.log('connected');
    $('#state-login').html('<b>接続済</b>');
    client.login();
  };
  client.reset = function() {
    console.log('reset');
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

  client.ready = function() {
    client.loadRoomList();
  }
  client.roomlist = function(list) {
    var $div = $('#list-room');
    $div.empty();
    _.each(list, function(data) {
      $div.append($('<a href="" class="room"></a>').attr('roomid', data).text(data));
    });
  };

  $(document).ready(function(){
    client.init();
  });

  return client;
})();
