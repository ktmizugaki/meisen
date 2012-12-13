var _ = require('underscore');
var CardGame = require('./cardgame');

function Meisen(callback, cb_data) {
  this.callback = callback;
  this.cb_data = cb_data;
  this.cardgame = null;
  this.table = null;
  this.tricks = null;
  this.current = 0;
  this.state = Meisen.State.INIT;
}
Meisen.CARD_SELECTOR = function(card) {
  return card.rank >= 4;
};
Meisen.NUM_JOKER = 1;
Meisen.NUM_PLAYER = 4;
Meisen.SUIT_ORDER = 'p,s,c,d,h,n'.split(',');
Meisen.TRICK_ORDER = '6,7,8,9,10,11'.split(',');
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
  this.current = 0;
  var data = { action: 'init', target: 'all' };
  this.callback(data, this, this.cb_data);
};
Meisen.prototype.action_setup = function() {
  if (this.state !== Meisen.State.INIT) {
    return;
  }
  this.cardgame = new CardGame();
  this.cardgame.createDeck(Meisen.CARD_SELECTOR, Meisen.NUM_JOKER);
  this.cardgame.shuffleDeck();
  this.cardgame.createPlayers(Meisen.NUM_PLAYER);
  this.current = 0;
  this.huki = null;
  this.table = [];
  this.tricks = [];
  for (var p = 0; p < Meisen.NUM_PLAYER; p++) {
    var player = this.cardgame.players[p];
    player.huki = null;
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
    agari: -1,
    current: this.current,
    players: _.map(this.cardgame.players, Meisen.playerToData)
  };
  this.callback(data, this, this.cb_data);
};
Meisen.prototype.action_huku = function(data) {
  if (this.state !== Meisen.State.READY && this.state !== Meisen.State.HUKI) {
    return;
  }
  var suit = data.suit;
  var trick = data.trick;
  var suito = _.indexOf(Meisen.SUIT_ORDER, suit);
  var tricko = _.indexOf(Meisen.TRICK_ORDER, trick);
  var player = this.cardgame.players[this.current];
  if (suito == -1) {
    console.log('ERROR: invalid suit:', suit);
    return;
  }
  if (suit != 'p') {
    if (tricko == -1) {
      console.log('ERROR: invalid trick:', trick);
      return;
    }
    if (this.huki !== null) {
      if (tricko < this.huki.trick) {
        console.log('ERROR: weak trick:', trick);
        return;
      }
      if (tricko == this.huki.trick && suito <= this.huki.suit) {
        console.log('ERROR: weak suit:', suit);
        return;
      }
    }
  }
  if (suit == 'p') {
    player.huki = 'p';
  } else {
    player.huki = ''+suit+trick;
    this.huki = { suit: suito, trick: tricko, id: player.id };
  }
  this.current++;
  this.state = Meisen.State.HUKI;
  var data = {
    action: 'huku', target: 'all',
    current: this.current,
    huki: _.clone(this.huki),
    players: [
      {
        id: player.id,
        huki: player.huki,
      }
    ]
  };
  this.callback(data, this, this.cb_data);
  if (this.current == 4) {
    if (this.huki === null) {
      this.action_init();
      return;
    }
    this.state_negli();
  }
};
Meisen.prototype.state_negli = function() {
  this.current = this.huki.id;
  var player = this.cardgame.players[this.current];
  var suit = Meisen.SUIT_ORDER[this.huki.suit];
  var trick = Meisen.TRICK_ORDER[this.huki.trick];
  console.log('suit:', suit, 'trick:', trick);
  this.state = Meisen.State.NEGLI;
  var agari = this.cardgame.deck.get();
  player.hand.push(agari);
  var data = {
    action: 'agari', target: 'all',
    agari: Meisen.cardToData(agari),
    players: [Meisen.playerToData(player)]
  };
  this.callback(data, this, this.cb_data);
};
Meisen.prototype.action_negru = function(data) {
  if (this.state !== Meisen.State.NEGLI) {
    return;
  }
  data.card = +data.card;
  if (_.isNaN(data.card)) {
    return;
  }
  var player = this.cardgame.players[this.current];
  var negli = null;
  _.each(player.hand, function(card, index){
    if (card.id === data.card) {
      negli = card;
      player.hand.splice(index, 1);
      return true;
    }
  });
  if (negli === null) {
    console.log('the card is not in hand:', data.card);
    return;
  }
  this.state = Meisen.State.PLAY;
  this.start = this.current;
  var data = {
    action: 'negru', target: 'all',
    current: this.current,
    negli: Meisen.cardToData(negli),
    players: [Meisen.playerToData(player)]
  };
  this.callback(data, this, this.cb_data);
};
Meisen.prototype.action_play = function(data) {
  if (this.state !== Meisen.State.PLAY) {
    return;
  }
  data.card = +data.card;
  if (_.isNaN(data.card)) {
    return;
  }
  var player = this.cardgame.players[this.current];
  var playedcard = null;
  _.each(player.hand, function(card, index){
    if (card.id === data.card) {
      playedcard = card;
      player.hand.splice(index, 1);
      return true;
    }
  });
  if (playedcard === null) {
    console.log('the card is not in hand:', data.card);
    return;
  }
  this.state = Meisen.State.PLAY;
  this.current = (this.current+1) % Meisen.NUM_PLAYER;
  this.table[player.id] = playedcard;
  var data = {
    action: 'play', target: 'all',
    current: this.current,
    player: player.id,
    card: Meisen.cardToData(playedcard),
  };
  this.callback(data, this, this.cb_data);
  if (this.current == this.start) {
    this.start = this.current;
    this.table = [];
    if (!player.hand.length) {
      this.state = Meisen.State.END;
      this.callback({ action: 'end' }, this, this.cb_data);
    } else {
      this.callback({ action: 'endtrick' }, this, this.cb_data);
    }
  }
};

function State(name, value) {
  this.name = name;
  this.value = value;
}
Meisen.State = State;
State.prototype.toString = function() {
  return 'State.'+this.name;
};
_.each('INIT,READY,HUKI,NEGLI,PLAY,END'.split(','), function(val, index) {
  State[val] = new State(val, index);
});

module.exports = Meisen;
