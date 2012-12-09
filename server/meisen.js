var _ = require('underscore');
var CardGame = require('./cardgame');

function Meisen(callback, cb_data) {
  this.callback = callback;
  this.cb_data = cb_data;
  this.cardgame = null;
  this.table = null;
  this.tricks = null;
  this.state = Meisen.State.INIT;
}
Meisen.CARD_SELECTOR = function(card) {
  return card.rank >= 4;
};
Meisen.NUM_JOKER = 1;
Meisen.NUM_PLAYER = 4;
Meisen.cardToData = function(card) {
  return card.id;
};
Meisen.playerToData = function(player) {
  return {
    id: player.id,
    hand: _.map(player.hand, Meisen.cardToData)
  };
};
Meisen.prototype.onData = function(data) {
  if (!data || typeof data.action !== 'string') {
    return false;
  }
  if (typeof this['action_'+data.action] !== 'function') {
    return false;
  }
  this['action_'+data.action](data);
  return true;
};
Meisen.prototype.action_init = function() {
  this.cardgame = null;
  this.table = null;
  this.tricks = null;
  this.state = Meisen.State.INIT;
  var data = { action: 'init', target: 'all' };
  this.callback(data, this, this.cb_data);
};
Meisen.prototype.action_setup = function() {
  if (this.state !== Meisen.State.INIT) {
    return;
  }
  this.cardgame = new CardGame();
  this.cardgame.createDeck(Meisen.CARD_SELECTOR, Meisen.NUM_JOKER);
  this.cardgame.createPlayers(Meisen.NUM_PLAYER);
  this.table = [];
  this.tricks = [];
  for (var p = 0; p < Meisen.NUM_PLAYER; p++) {
    var player = this.cardgame.players[p];
    player.hand.length = 0;
  }
  for (var h = 0; h < 10; h++) {
    for (var p = 0; p < Meisen.NUM_PLAYER; p++) {
      var player = this.cardgame.players[p];
      player.hand[h] = this.cardgame.deck.get();
    }
  }
  this.state = Meisen.State.READY;
  var data = {
    action: 'setup', target: 'all',
    table: [],
    tricks: [],
    players: _.map(this.cardgame.players, Meisen.playerToData)
  };
  this.callback(data, this, this.cb_data);
};

function State(name, value) {
  this.name = name;
  this.value = value;
}
Meisen.State = State;
State.prototype.toString = function() {
  return 'State.'+this.name;
};
_.each('INIT,READY'.split(','), function(val, index) {
  State[val] = new State(val, index);
});

module.exports = Meisen;
