var client = null;

(function(){
  client = {};
  client.name = null;
  client.socket = null;
  client.socketOptions = {
    'try multiple transports': false,
    reconnect: false
  };
  client.connect = function() {
    console.log('connect');
    if (client.socket !== null) {
      console.log('connection is active');
      return false;
    }
    $('#state-login').html('<b>接続中</b>');
    var socket = client.socket = io.connect('http://'+location.host+'/', client.socketOptions);
    socket.name = $('#name-login').value;
    socket.on('connect', function (data) {
      console.log('socket.connected');
      if (client.socket === socket) {
        client.connected();
      }
    });
    socket.on('disconnect', function (data) {
      console.log('socket.disconnected');
      if (client.socket === socket) {
        client.reset();
      }
    });
    socket.on('chat-message', function (data) {
      console.log('socket.chat-message');
    });
  };
  client.connected = function() {
    console.log('connected');
    $('#state-login').html('<b>接続済</b>');
    client.login();
  };
  client.login = function() {
    console.log('login');
    if (client.socket !== null && client.name === null) {
      client.name = client.socket.name;
      client.socket.emit('login', { name: 'data' });
    }
  };
  client.prepareRoom = function() {
    socket.emit('ferret', 'tobi', function (data) {
      console.log(data); // data will be 'woot'
    });
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

  $(document).ready(function(){
    client.init();
  });

  return client;
})();
