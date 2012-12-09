var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 360;
var CARD_WIDTH = 36;
var CARD_HEIGHT = CARD_WIDTH*14/9;
function MeisenUI() {
  this.canvas = null;
  this.paper = null;
  this.state = null;
}
MeisenUI.prototype.onResize = function() {
  var width = this.canvas.width(), height = this.canvas.height();
  this.paper.changeSize(width, height, true, true);
};
MeisenUI.prototype.onMeisenEvent = function(event) {
  if (!event || !event.name) {
    return;
  }
};
MeisenUI.prototype.init = function() {
  this.svgCard = $('#svg-cards')[0].contentDocument;
  this.canvas = $('#canvas');
  var width = this.canvas.width(), height = this.canvas.height();
  this.paper = new ScaleRaphael('canvas', CANVAS_WIDTH, CANVAS_HEIGHT);
  var paper = this.paper;
  this.paper.card = function(card, x, y) {
    var name = CardNames[card];
    var card = this.rect(x, y, CARD_WIDTH, CARD_HEIGHT);
    card.attr({fill: "#fff"});
    card.value = card;
    card.click(function(){
      this.animate(Raphael.animation(
        { x: this.attr("x")+16, y: this.attr("y")+16 },
        100));
    });
    //card.image = this.canvas.getElementById(name).cloneNode(false);
    if (card.image) {
      card.node.parentNode.appendChild(card.image);
    } else {
      card.text = this.text(x+4, y+16, CardNames.shortName(name));
      card.text.attr('font-size', 24);
      card.text.attr('text-anchor', 'start');
      card.text.attr('width', CARD_WIDTH-8);
    }
    return card;
  };
  $(window).resize(_.bind(this.onResize, this));
  $('#game-init').click(function(){
    client.sendGameEvent({ action: 'init' });
  });
  $('#game-setup').click(function(){
    client.sendGameEvent({ action: 'setup' });
  });
  this.reset();
};
MeisenUI.prototype.reset = function() {
  this.watching = 0;
  this.paper.clear();
  //this.paper.canvas.appendChild(this.svgCard.lastChild.cloneNode(true));
  this.onResize();
};
MeisenUI.prototype.onData = function(data) {
  if (!data || typeof data.action !== 'string') {
    return;
  }
  if (typeof this['action_'+data.action] !== 'function') {
    return;
  }
  this['action_'+data.action](data);
};
MeisenUI.prototype.action_init = function(data) {
  this.reset();
};
MeisenUI.prototype.setupPlayer = function(data) {
  var pos = (data.id - this.watching + MEISEN_NUM_PLAYER) % MEISEN_NUM_PLAYER;
  var center = { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2 };
  var rotation = -pos*Math.PI/2;
  var sin = Math.sin(rotation), cos = Math.cos(rotation);
  var x = 0, y = pos * CARD_HEIGHT;
  for (var c in data.hand) {
    var card = this.paper.card(data.hand[c], x, y);
    x += CARD_WIDTH;
  }
};
MeisenUI.prototype.action_setup = function(data) {
  this.paper.clear();
  for (var p in data.players) {
    this.setupPlayer(data.players[p]);
  }
};
