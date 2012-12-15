var events = require('events');
var util = require('util');
var _ = require('underscore');

function CardGame() {
  events.EventEmitter.call(this);
  this.deck = null;
  this.players = [];
  this.table = [];
  this.current = 0;
}
util.inherits(CardGame, events.EventEmitter);
CardGame.prototype.createDeck = function(selector, numJoker) {
  this.deck = new Deck(selector, numJoker);
}
CardGame.prototype.shuffleDeck = function() {
  if (!this.deck) {
    return;
  }
  this.deck.shuffle();
}
CardGame.prototype.createPlayers = function(numPlayer, playerClass) {
  if (!playerClass) playerClass = Player;
  this.players.length = 0;
  for (var i = 0; i < numPlayer; i++) {
    this.players[i] = new playerClass(i);
  }
}
/* get current player */
CardGame.prototype.currentPlayer = function() {
  if (this.current >= this.players.length) {
    return null;
  }
  return this.players[this.current];
};
/* change current player to next player */
CardGame.prototype.setPlayer = function(current) {
  if (current < 0 || current >= this.players.length) {
    throw new Error('Index is out of bounds:', current);
  }
  this.current = 0;
  return this.current;
};
/* change current player to next player */
CardGame.prototype.playerNext = function() {
  if (this.players.length) {
    this.current = (this.current+1) % this.players.length;
  }
  return this.current;
};
/* change current player to next player */
CardGame.prototype.playerPrevious = function() {
  if (this.players.length) {
    this.current = (this.current+this.players.length-1) % this.players.length;
  }
  return this.current;
};

/* change current player to next player */
CardGame.prototype.dealCard = function() {
  var player = this.currentPlayer();
  var card = this.deck.get();
  player.hand[player.hand.length] = card;
  return card;
};

function Card(id, suit, rank, name) {
  this.id = id;
  this.suitId = suit;
  this.rank = rank;
  this.name = name;
  this.suitStr = Card.SUIT[suit-1] || '';
}
CardGame.Card = Card;
Card.SUIT = ['c','d','h','s'];
Card.RANK = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
Card.CARDS = [];
Card.BACK = null;
_.each('club,diamond,heart,spade'.split(','), function(suit, suitv) {
  _.each('1,2,3,4,5,6,7,8,9,10,jack,queen,king'.split(','), function(rank, rankv) {
    var id = suitv*13 + rankv;
    Card.CARDS[id] = new Card(id, suitv+1, rankv+1, rank+'_'+suit);
  });
});
_.each('black_joker,red_joker'.split(','), function(other, val) {
  var id = 52+val;
  Card.CARDS[id] = new Card(id, 5, val+1, other);
});
Card.BACK = new Card(-1, 0, 0, 'back');
Card.prototype.toString = function() {
  if (this.suitId == 0) return 'bc';
  if (this.suitId == 5) return 'jk';
  return Card.SUIT[this.suitId-1]+Card.RANK[this.rank-1];
};

function Deck(selector, numJoker) {
  this.cards = _.select(Card.CARDS, function(card) {
    if (card.suitId <= 4) return selector(card);
    return card.rank <= numJoker;
  });
  this.pos = 0;
  this.left = this.cards.length;
  this.size = this.cards.length;
}
CardGame.Deck = Deck;
Deck.prototype.shuffle = function() {
  this.cards = _.shuffle(this.cards);
  this.pos = 0;
  this.left = this.cards.length;
  this.size = this.cards.length;
};
Deck.prototype.get = function() {
  if (this.pos >= this.size) {
    return null;
  }
  this.left--;
  return this.cards[this.pos++];
};
Deck.prototype.peek = function() {
  if (this.pos >= this.size) {
    return null;
  }
  return this.cards[this.pos];
};

function Player(id) {
  this.id = id;
  this.hand = [];
}
CardGame.Player = Player;

module.exports = CardGame;
