var CardNames = [];
_.each('club,diamond,heart,spade'.split(','), function(suit, suitv) {
  _.each('1,2,3,4,5,6,7,8,9,10,jack,queen,king'.split(','), function(rank, rankv) {
    var id = suitv*13 + rankv;
    CardNames[id] = rank+'_'+suit;
  });
});
_.each('black_joker,red_joker'.split(','), function(other, val) {
  var id = 52+val;
  CardNames[id] = other;
});
CardNames[-1] = 'back';
CardNames.shortName = function(name) {
  if (name == 'back') return 'bc';
  if (name.indexOf('joker') > -1) return 'jk';
  return name.charAt(name.indexOf('_')+1)+ name.charAt(0);
};

function GameState(name, value) {
  this.name = name;
  this.value = value;
};
GameState.prototype.toString = function() {
  return 'GameState.'+this.name;
};
_.each('INIT,READY'.split(','), function(val, index) {
  GameState[val] = new GameState(val, index);
});

var MEISEN_NUM_PLAYER = 4;
