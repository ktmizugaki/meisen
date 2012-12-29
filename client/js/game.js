var CardNames = [];
CardNames.ctor = function (suit, rank, name) {
  this.name = name || rank+'_'+suit;
  this.suit = suit;
  this.rank = rank;
};
CardNames.ctor.prototype.shortName = function () {
  if (this.name == 'back') return 'bc';
  if (this.suit == 'joker') return 'jk';
  if (!this.suit || !this.rank) return this.name.substr(0, 2);
  var suit = this.suit.charAt(0);
  var rank = this.rank.charAt(0).toUpperCase();
  if (rank == '1') rank = 'A';
  return suit+rank;
};
_.each('club,diamond,heart,spade'.split(','), function(suit, suitv) {
  _.each('1,2,3,4,5,6,7,8,9,10,jack,queen,king'.split(','), function(rank, rankv) {
    var id = suitv*13 + rankv;
    CardNames[id] = new CardNames.ctor(suit, rank);
  });
});
_.each('black_joker,red_joker'.split(','), function(other, val) {
  var id = 52+val;
  CardNames[id] = new CardNames.ctor('joker', null, other);
});
CardNames[-1] = new CardNames.ctor('back', null, 'back');

function GameState(name, value) {
  this.name = name;
  this.value = value;
};
GameState.prototype.toString = function() {
  return 'GameState.'+this.name;
};
_.each('INIT,READY,HUKI,NEGLI,PLAY,ENDTRICK,RESULT,END'.split(','), function(val, index) {
  GameState[val] = new GameState(val, index);
});

var MEISEN_NUM_PLAYER = 4;
var MEISEN_SUIT_ORDER = 'bpscdhn';
