var util = require('util');
var _ = require('underscore');
var CardGame = require('./cardgame');

function Meisen(callback, cb_data) {
  CardGame.call(this);
  this.callback = callback;
  this.cb_data = cb_data;
  this.state = Meisen.State.INIT;
  this.deck = null;
  this.players = [];
  this.table = [];
  this.tricks = [];
  this.huki = null;
  this.agari = null;
  this.negli = null;
  this.trick = null;
  this.dealer = 0;
  this.current = 0;
  this.ack = 0;
  this.point = null;
  this.createPlayers(Meisen.NUM_PLAYER, Meisen.Player);
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
    huki: _.clone(meisen.huki),
    trick: Meisen.trickToData(target.acbit)(meisen.trick),
    point: meisen.point,
    tricks: _.map(meisen.tricks, Meisen.trickToData(target.acbit)),
    agari: Meisen.cardToData(target.acbit)(meisen.agari),
    negli: Meisen.cardToData(target.acbit)(meisen.negli),
    dealer: meisen.dealer,
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
      points: player.points,
      hand: _.map(player.hand, Meisen.cardToData(acbits))
    };
  };
};
Meisen.trickToData = function(acbits) {
  return function(trick) {
    if (!_.isObject(trick)) return trick;
    return {
      start: trick.start,
      playerid: trick.playerid,
      table: _.map(trick.table, Meisen.cardToData(acbits))
    };
  };
};
Meisen.prototype.invokeCallback = function(data) {
  if (this.callback) {
    this.callback(data, this, this.cb_data);
  }
};
Meisen.prototype.setTimeout = function(func, to) {
  if (this.toid) {
    this.clearTimeout();
  }
  this.toid = setTimeout(_.bind(func, this), to);
};
Meisen.prototype.clearTimeout = function() {
  if (this.toid) {
    clearTimeout(this.toid);
    this.toid = 0;
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
  this.clearTimeout();
  this.state = Meisen.State.INIT;
  this.deck = null;
  this.players = [];
  this.table = [];
  this.tricks.length = 0;
  this.huki = null;
  this.agari = null;
  this.negli = null;
  this.trick = null;
  this.current = this.dealer;
  this.ack = 0;
  this.point = null;
  this.createPlayers(Meisen.NUM_PLAYER, Meisen.Player);
  var data = { action: 'init', target: 'all' };
  this.invokeCallback(data);
};
Meisen.prototype.action_setup = function() {
  if (this.state !== Meisen.State.INIT) {
    return;
  }
  this.state_setup();
};
Meisen.prototype.state_setup = function() {
  this.createDeck(Meisen.CARD_SELECTOR, Meisen.NUM_JOKER);
  this.shuffleDeck();
  _.each(this.players, function(player) {
    player.huki = null;
    player.hand = [];
  }, this);
  this.table = [];
  this.tricks.length = 0;
  this.huki = null;
  this.agari = null;
  this.negli = null;
  this.trick = null;
  this.current = this.dealer;
  this.ack = 0;
  this.point = null;
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
  var player = this.currentPlayer();
  if (player.huki != null) {
    return;
  }
  this.clearTimeout();
  var suitStr = data.suit;
  var trick = data.trick;
  var suitOrder = _.indexOf(Meisen.SUIT_ORDER, suitStr);
  var trickOrder = _.indexOf(Meisen.TRICK_ORDER, trick);
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
    var singleQueen = 0;
    var fourJacks = 0;
    _.each(player.hand, function(card) {
      if (card.rank == 1 || card.rank == 11 || card.rank == 13) {
        hasPicture = true;
      }
      if (card.rank == 11) fourJacks++;
      if (card.rank == 12) singleQueen++;
    });
    if ((hasPicture || singleQueen > 1) && fourJacks != 4) {
      console.log('can\'t declare broken:', player.id);
      return;
    }
    player.huki = 'b';
    _.each(player.hand, function(card) {
      card.__acl = Target.all.acbit;
    });
    var data = {
      action: 'huku', target: 'all',
      huki: _.clone(this.huki),
      players: [ Meisen.playerToData(0xffff)(player) ]
    };
    this.invokeCallback(data);
    this.setTimeout(this.state_setup, 5000);
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
  this.playerNext();
  this.state = Meisen.State.HUKI;
  var data = {
    action: 'huku', target: 'all',
    huki: _.clone(this.huki),
    players: [ { id: player.id, huki: player.huki, } ]
  };
  this.invokeCallback(data);
  if (this.current == this.dealer) {
    if (this.huki === null) {
      this.setTimeout(this.state_setup, 3000);
      return;
    }
    this.state_negli();
  } else {
    this.state_huki();
  }
};
Meisen.prototype.state_huki = function() {
  this.setTimeout(function() {
    this.state = Meisen.State.HUKI;
    var data = {
      action: 'huki', target: 'all',
      current: this.current,
    };
    this.invokeCallback(data);
  }, 1000);
};
Meisen.prototype.state_negli = function() {
  this.current = this.huki.id;
  var player = this.currentPlayer();
  this.state = Meisen.State.NEGLI;
  this.agari = this.dealCard();
  this.agari.__acl = Target.PLAYERS[this.current].acbit;
  _.each(Target.VALUES, function (target) {
    if (target != Target.all) {
      var data = {
        action: 'agari', target: target.name,
        current: this.current,
        player: player.id,
        huki: _.clone(this.huki),
        card: Meisen.cardToData(target.acbit)(this.agari),
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
    this.state = Meisen.State.ENDTRICK;
    data = {
      action: 'endtrick', target: 'all',
      current: this.current
    };
    this.invokeCallback(data);
    this.setTimeout(function() {
      this.ack = 0xf;
      this.action_ackendtrick();
    }, 5000);
  }
};
Meisen.prototype.action_ackendtrick = function(data) {
  if (this.state !== Meisen.State.ENDTRICK) {
    return;
  }
  if (data) {
    this.ack |= 1<<data.player;
  }
  if ((this.ack&0xf) != 0xf) {
    return;
  }
  data = {
    action: 'endendtrick', target: 'all',
    current: this.current
  };
  this.invokeCallback(data);
  this.clearTimeout();
  this.ack = 0;
  this.tricks.push(this.trick);
  this.trick = null;
  if (this.tricks.length >= 10) {
    this.state_result();
  } else {
    this.state = Meisen.State.PLAY;
    this.trick = new Meisen.Trick(this.current);
    data = { action: 'trick', target: 'all', current: this.current };
    this.invokeCallback(data);
  }
};
Meisen.prototype.state_result = function() {
  this.state = Meisen.State.RESULT;
  this.current = null;
  if (this.agari) this.agari.__acl = Target.all.acbit;
  if (this.negli) this.negli.__acl = Target.all.acbit;
  var p = this.huki.id%2;
  var t = 0;
  for (var i = 0; i < 10; i++) {
    if (this.tricks[i].result()%2 == p) t++;
  }
  if (t >= this.huki.trick) {
    this.point = t + this.huki.trick - 10;
    this.players[p].points += this.point;
    this.players[p+2].points += this.point;
  } else {
    p = (p+1)%2;
    this.point = (t - this.huki.trick)*2;
    this.players[p].points -= this.point;
    this.players[p+2].points -= this.point;
  }
  _.each(this.tricks, function(trick) {
    _.each(trick.table, function(card) {
      card.__acl = Target.all.acbit;
    }, this);
  }, this);
  data = {
    action: 'result', target:'all',
    huki: _.clone(this.huki),
    point: this.point,
    players: _.map(this.players, Meisen.playerToData(Target.all.acbit)),
    agari: Meisen.cardToData(Target.all.acbit)(this.agari),
    negli: Meisen.cardToData(Target.all.acbit)(this.negli),
    tricks: _.map(this.tricks, Meisen.trickToData(Target.all.acbit)),
  };
  this.invokeCallback(data);
  this.setTimeout(function() {
    this.ack = 0xf;
    this.action_ackresult();
  }, 300*1000);
};
Meisen.prototype.action_ackresult = function(data) {
  if (this.state !== Meisen.State.RESULT) {
    return;
  }
  if (data) {
    this.ack |= 1<<data.player;
    this.ack = 0xf;
  }
  if ((this.ack&0xf) != 0xf) {
    return;
  }
  this.point = null;
  this.ack = 0;
  this.clearTimeout();
  this.dealer = (this.dealer+1)%4;
  this.state_setup();
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
  this.points = 0;
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
