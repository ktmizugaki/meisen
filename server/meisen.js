var util = require('util');
var _ = require('underscore');
var CardGame = require('./cardgame');

function Meisen(callback, cb_data) {
  CardGame.call(this);
  this.callback = callback;
  this.cb_data = cb_data;
  this.state = Meisen.State.INIT;
  this.tricks = [];
  this.huki = null;
  this.agari = null;
  this.negli = null;
  this.trick = null;
}
util.inherits(Meisen, CardGame);
Meisen.CARD_SELECTOR = function(card) {
  return card.rank == 1 || card.rank >= 5;
};
Meisen.NUM_JOKER = 1;
Meisen.NUM_PLAYER = 4;
Meisen.SUIT_ORDER = 'b,p,s,c,d,h,n'.split(',');
Meisen.TRICK_ORDER = '6,7,8,9,10,11'.split(',');
/* trump's suit to huku juck's suit */
Meisen.HUKUJACK_SUIT = { b: 'b', p: 'p', s: 'c', c: 's', d: 'h', h: 'd', n: 'n' };
Meisen.meisenToData = function(meisen, target) {
  var data = {
    action: 'load', target: target.name,
    players: _.map(meisen.players, Meisen.playerToData(target.acbit)),
    table: _.map(meisen.table, Meisen.cardToData(target.acbit)),
    huki: _.clone(this.huki),
    trick: Meisen.trickToData(target.acbit)(meisen.trick),
    tricks: _.map(meisen.tricks, Meisen.trickToData(target.acbit)),
    agari: Meisen.cardToData(target.acbit)(meisen.agari),
    negli: Meisen.cardToData(target.acbit)(meisen.negli),
    current: meisen.current,
    state: meisen.state.name,
  };
  return data;
};
Meisen.cardToData = function(acbits) {
  return function(card) {
    if (!_.isObject(card)) return card;
    if (!(card.__acl & (acbits|Target.all.acbit))) {
      return -1;
    }
    return card.id;
  };
};
Meisen.playerToData = function(acbits) {
  return function(player) {
    if (!_.isObject(player)) return player;
    return {
      id: player.id,
      huki: player.huki,
      hand: _.map(player.hand, Meisen.cardToData(acbits))
    };
  };
};
Meisen.trickToData = function(acbits) {
  return function(trick) {
    if (!_.isObject(trick)) return trick;
    return {
      start: trick.start,
      table: _.map(trick.table, Meisen.cardToData(acbits))
    };
  };
};
Meisen.prototype.invokeCallback = function(data) {
  if (this.callback) {
    this.callback(data, this, this.cb_data);
  }
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
Meisen.prototype.cardSuitStr = function(card) {
  if (card.suitId == 5) {
    return this.huki.suitStr;
  }
  if (card.rank == 11 && card.suitStr == Meisen.HUKUJACK_SUIT[this.huki.suitStr]) {
    return this.huki.suitStr;
  }
  return card.suitStr;
};
Meisen.prototype.action_init = function() {
  this.deck = null;
  this.players = [];
  this.table = [];
  this.current = 0;
  this.state = Meisen.State.INIT;
  this.tricks.length = 0;
  this.huki = null;
  this.trick = null;
  var data = { action: 'init', target: 'all' };
  this.invokeCallback(data);
};
Meisen.prototype.action_setup = function() {
  if (this.state !== Meisen.State.INIT) {
    return;
  }
  if (this.toid) {
    clearTimeout(this.toid);
    this.toid = 0;
  }
  this.createDeck(Meisen.CARD_SELECTOR, Meisen.NUM_JOKER);
  this.shuffleDeck();
  this.createPlayers(Meisen.NUM_PLAYER, Meisen.Player);
  for (var i = 0; i < 40; i++) {
    var card = this.dealCard();
    card.__acl = Target.PLAYERS[this.current].acbit;
    this.playerNext();
  }
  this.state = Meisen.State.READY;
  _.each(Target.VALUES, function (target) {
    if (target != Target.all) {
      var data = {
        action: 'setup', target: target.name,
        table: [],
        tricks: [],
        agari: -1,
        current: this.current,
        players: _.map(this.players, Meisen.playerToData(target.acbit))
      };
      this.invokeCallback(data);
    }
  }, this);
  this.state_huki();
};
Meisen.prototype.action_huku = function(data) {
  if (this.state !== Meisen.State.HUKI) {
    return;
  }
  if (this.current != data.player) {
    console.log('Meisen: huku: wrong player:', data.player, '/', this.current);
    return;
  }
  if (this.toid) {
    clearTimeout(this.toid);
    this.toid = 0;
  }
  var suitStr = data.suit;
  var trick = data.trick;
  var suitOrder = _.indexOf(Meisen.SUIT_ORDER, suitStr);
  var trickOrder = _.indexOf(Meisen.TRICK_ORDER, trick);
  var player = this.currentPlayer();
  if (suitOrder == -1) {
    console.log('ERROR: invalid suit:', suitStr);
    return;
  }
  if (suitStr != 'b' && suitStr != 'p') {
    if (trickOrder == -1) {
      console.log('ERROR: invalid trick:', trick);
      return;
    }
    if (this.huki !== null) {
      if (trickOrder < this.huki.trickOrder) {
        console.log('ERROR: weak trick:', trick);
        return;
      }
      if (trickOrder == this.huki.trickOrder && suitOrder <= this.huki.suitOrder) {
        console.log('ERROR: weak suit:', suitStr);
        return;
      }
    }
  }
  if (suitStr == 'b') {
    var hasPicture = false;
    _.each(player.hand, function(card) {
      if (card.rank == 1 || card.rank >= 11) {
        hasPicture = true;
      }
    });
    if (hasPicture) {
      console.log('can\'t declare broken:', player.id);
      return;
    }
    player.huki = 'b';
    var data = {
      action: 'huku', target: 'all',
      huki: _.clone(this.huki),
      players: [ Meisen.playerToData(0xffff)(player) ]
    };
    this.invokeCallback(data);
    this.state = Meisen.State.INIT;
    var self = this;
    this.toid = setTimeout(function() {
      self.action_setup();
    }, 3000);
    return;
  } if (suitStr == 'p') {
    player.huki = 'p';
  } else {
    player.huki = ''+suitStr+trick;
    this.huki = {
      suitStr: suitStr, trick: +trick, id: player.id,
      suitOrder: suitOrder, trickOrder: trickOrder
    };
  }
  this.current++;
  this.state = Meisen.State.HUKI;
  var data = {
    action: 'huku', target: 'all',
    huki: _.clone(this.huki),
    players: [ { id: player.id, huki: player.huki, } ]
  };
  this.invokeCallback(data);
  if (this.current == 4) {
    if (this.huki === null) {
      this.action_init();
      return;
    }
    this.state_negli();
  } else {
    this.state_huki();
  }
};
Meisen.prototype.state_huki = function() {
  var meisen = this;
  this.toid = setTimeout(function() {
    meisen.state = Meisen.State.HUKI;
    var data = {
      action: 'huki', target: 'all',
      current: meisen.current,
    };
    meisen.invokeCallback(data);
  }, 1000);
};
Meisen.prototype.state_negli = function() {
  this.current = this.huki.id;
  var player = this.currentPlayer();
  this.state = Meisen.State.NEGLI;
  var agari = this.dealCard();
  agari.__acl = Target.PLAYERS[this.current].acbit;
  _.each(Target.VALUES, function (target) {
    if (target != Target.all) {
      var data = {
        action: 'agari', target: target.name,
        current: this.current,
        player: player.id,
        card: Meisen.cardToData(target.acbit)(agari),
      };
      this.invokeCallback(data);
    }
  }, this);
};
Meisen.prototype.action_negru = function(data) {
  if (this.state !== Meisen.State.NEGLI) {
    return;
  }
  if (this.current != data.player) {
    console.log('Meisen: negru: wrong player:', data.player, '/', this.current);
    return;
  }
  data.card = +data.card;
  if (_.isNaN(data.card)) {
    return;
  }
  var player = this.currentPlayer();
  var negli = null;
  _.each(player.hand, function(card, index){
    if (card.id === data.card) {
      negli = card;
      player.hand.splice(index, 1);
      return true;
    }
  }, this);
  if (negli === null) {
    console.log('the card is not in hand:', data.card);
    return;
  }
  this.negli = negli;
  this.state = Meisen.State.PLAY;
  this.results = [];
  _.each(Target.VALUES, function (target) {
    if (target != Target.all) {
      var data = {
        action: 'negru', target: target.name,
        current: this.current,
        player: player.id,
        card: Meisen.cardToData(target.acbit)(negli),
      };
      this.invokeCallback(data);
    }
  }, this);
  this.trick = new Meisen.Trick(this.current);
  data = { action: 'trick', target: 'all', current: this.current };
  this.invokeCallback(data);
};
Meisen.prototype.action_play = function(data) {
  if (this.state !== Meisen.State.PLAY) {
    return;
  }
  if (this.current != data.player) {
    console.log('Meisen: play: wrong player:', data.player, '/', this.current);
    return;
  }
  if (!this.trick.action_play(data, this)) {
    return;
  }
  if (this.current == this.trick.start) {
    this.current = this.trick.result();
    this.results.push(this.trick);
    this.state = Meisen.State.ENDTRICK;
    data = {
      action: 'endtrick', target: 'all',
      current: this.current
    };
    this.invokeCallback(data);
    var self = this;
    this.toid = setTimeout(function() {
      self.ack = 0xf;
      self.action_ackendtrick();
    }, 5000);
  }
};
Meisen.prototype.action_ackendtrick = function(data){
  if (this.state !== Meisen.State.ENDTRICK) {
    return;
  }
  if (data) {
    this.ack |= 1<<data.player;
  }
  if ((this.ack&0xf) != 0xf) {
    return;
  }
  if (this.toid) {
    clearTimeout(this.toid);
    this.toid = 0;
  }
  this.tricks.push(this.trick);
  this.trick = null;
  if (this.results.length >= 10) {
    this.state = Meisen.State.END;
    data = { action:'end',target:'all' };
    this.invokeCallback(data);
  } else {
    this.state = Meisen.State.PLAY;
    this.trick = new Meisen.Trick(this.current);
    data = { action: 'trick', target: 'all', current: this.current };
    this.invokeCallback(data);
  }
};
Meisen.prototype.state_result = function() {
};

function State(name, value) {
  this.name = name;
  this.value = value;
}
Meisen.State = State;
State.prototype.toString = function() {
  return 'State.'+this.name;
};
_.each('INIT,READY,HUKI,NEGLI,PLAY,ENDTRICK,RESULT,END'.split(','), function(val, index) {
  State[val] = new State(val, index);
});

function Target(name, value) {
  this.name = name;
  this.value = value;
  this.acbit = 1 << value;
}
Meisen.Target = Target;
Target.prototype.toString = function() {
  return 'Target.'+this.name;
};
Target.VALUES = [];
Target.PLAYERS = [];
_.each('all,other,player0,player1,player2,player3'.split(','), function(val, index) {
  var targz = new Target(val, index);
  Target[val] = targz;
  Target.VALUES[index] = targz;
  if (val.indexOf('player') == 0) {
    Target.PLAYERS[index-2] = targz;
  }
});

function Player() {
  CardGame.Player.apply(this, arguments);
  this.huki = null;
}
util.inherits(Player, CardGame.Player);
Meisen.Player = Player;

function Trick(start) {
  this.start = start;
  this.suitStr = null;
  this.playerid = -1;
  this.table = [];
}
Meisen.Trick = Trick;
Trick.prototype.cardStrength = function(card, meisen) {
  if (card.suitId === 5) {
    return 0x30;
  }
  if (card.suitStr == meisen.huki.suitStr) {
    return 0x20 + (card.rank == 11? 15: card.rank == 1? 13: card.rank-1);
  }
  if (card.rank == 11 && card.suitStr == Meisen.HUKUJACK_SUIT[meisen.huki.suitStr]) {
    return 0x20 + 14;
  }
  if (this.suitStr && card.suitStr == this.suitStr) {
    return 0x10 + (card.rank == 1? 13: card.rank-1);
  }
  return 0;
};
Trick.prototype.canPlay = function(player, card, meisen) {
  if (this.suitStr === null) {
    return true;
  }
  if (card.suitId == 5) {
    return true;
  }
  if (meisen.cardSuitStr(card) == this.suitStr) {
    return true;
  }
  var canPlay = true;
  var testStr = 'player:'+player.id;
  _.each(player.hand, function(card){
    testStr += ', '+meisen.cardSuitStr(card);
    if (meisen.cardSuitStr(card) == this.suitStr) {
      canPlay = false;
    }
  }, this);
  return canPlay;
};
Trick.prototype.action_play = function(data, meisen) {
  data.card = +data.card;
  if (_.isNaN(data.card)) {
    return false;
  }
  var player = meisen.currentPlayer();
  var playedindex = null;
  var playedcard = null;
  _.each(player.hand, function(card, index) {
    if (card.id === data.card) {
      playedcard = card;
      playedindex = index;
      return true;
    }
  });
  if (playedcard === null) {
    console.log('the card is not in hand:', data.card);
    return false;
  }
  if (!this.canPlay(player, playedcard, meisen)) {
    console.log('cant play card:', playedcard);
    return false;
  }
  player.hand.splice(playedindex, 1);
  this.table[player.id] = meisen.table[player.id] = playedcard;
  if (this.playerid == -1) {
    this.playerid = player.id;
  } else if (this.cardStrength(this.table[player.id], meisen)
    > this.cardStrength(this.table[this.playerid], meisen)) {
    this.playerid = player.id;
  }
  if (this.suitStr === null) {
    this.suitStr = meisen.cardSuitStr(playedcard);
  }
  playedcard.__acl = Target.all.acbit;
  meisen.playerNext();
  var data = {
    action: 'play', target: 'all',
    current: meisen.current,
    player: player.id,
    card: Meisen.cardToData(Target.all.acbit)(playedcard),
  };
  meisen.invokeCallback(data);
  return true;
};
Trick.prototype.result = function() {
  return this.playerid;
};
module.exports = Meisen;
