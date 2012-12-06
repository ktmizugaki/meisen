var client = null;

(function(){
  client = {};
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
    $('#button-login').click(function() {
        client.connect();
    });
  };
  client.connect = function() {
    console.log('connect');
    if (client.socket !== null) {
      console.log('connection is active');
      return false;
    }
    $('#state-login').html('<b>接続中</b>');
    client.socket = new Client(client, $('#name-login').value);
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
      client.socket.login(clint.name);
    }
  };
  client.prepareRoom = function() {
    client.socket.genRoomId(function (data) {
      console.log('genRoomId:'+data);
      client.roomid = data;
    });
  };

  client.ready = function() {
    client.socket.getRoomList();
  }
  client.roomlist = function(list) {
    var $div = $('#list-room');
    $div.empty();
    _.each(list, function(data) {
      $div.append($("<div></div>").text(data));
    });
  };

  $(document).ready(function(){
    client.init();
  });

  return client;
})();
