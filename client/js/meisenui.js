var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 360;
var CARD_WIDTH = 36;
var CARD_HEIGHT = CARD_WIDTH*14/9;
var svgCards = null;
Raphael.fn.card = function(cardid, x, y) {
  var name = CardNames[cardid];
  var card = this.group();
  card.rect = this.rect(0, 0, CARD_WIDTH, CARD_HEIGHT),
  card.text = this.text(4, 16, CardNames.shortName(name))
  //card.image = $('#'+name, svgCards)[0].cloneNode(true);
  //card.push(card.image);
  card.push(card.rect);
  card.push(card.text);

  card.rect.attr({fill: "#fff"});
  card.text.attr({'font-size': 24, 'text-anchor': 'start' });
  card.text.attr({'x': 4, 'y': 16 });

  card.value = cardid;
  card.move(x, y);
  return card;
};
Raphael.fn.player = function(playerid, x, y) {
  var player = this.group();
  player.move(x, y);
  player.text = this.text(4, 14, 'p'+playerid);
  player.push(player.text);
  player.huki = null;
  player.hand = [];
  player.text.attr({'font-size': 24, 'text-anchor': 'start' });

  player.addcard = Raphael.fn.player.addcard;
  player.huku = Raphael.fn.player.huku;
  return player;
};
Raphael.fn.player.addcard = function(card) {
  var size = this.hand.length;
  this.push(card);
  this.hand.push(card);
  card.attr('x', 48+size*CARD_WIDTH);
  card.attr('y', 0);
};
Raphael.fn.player.huku = function(huki) {
  if (this.huki !== null) {
    this.huki.remove();
    this.huki = null;
  }
  if (huki) {
    this.huki = this.paper.text(16, 40, ''+huki)
    this.huki.attr({'font-size': 20, 'text-anchor': 'start' });
    this.push(this.huki);
  }
};

function MeisenUI() {
  this.canvas = null;
  this.paper = null;
  this.state = null;
}
MeisenUI.prototype.onResize = function() {
  var width = this.canvas.width(), height = this.canvas.height();
  this.paper.changeSize(width, height, true, true);
};
MeisenUI.prototype.init = function() {
  svgCards = $('svg', $('#svg-cards')[0].contentDocument)[0];
  var group = svgCards.children[1];
  for (var i = 0, ii = group.children.length; i < ii; i++) {
    var g = group.children[i];
    var x = g.children[0].getAttribute('x'), y = g.children[0].getAttribute('y');
    var t = 'translate('+(-x)+','+(236-y)+')';
    g.setAttribute('transform', t);
  }
  this.canvas = $('#canvas');
  var width = this.canvas.width(), height = this.canvas.height();
  this.paper = new ScaleRaphael('canvas', CANVAS_WIDTH, CANVAS_HEIGHT);
  var paper = this.paper;
  $(window).resize(_.bind(this.onResize, this));
  $('#game-init').click(function(){
    client.sendGameEvent({ action: 'init' });
  });
  $('#game-setup').click(function(){
    client.sendGameEvent({ action: 'setup' });
  });
  $('#game-huku').click(function(){
    var huki = $('#input-huki').val();
    if (huki.length >= 1) {
      var data = { action: 'huku' };
      data.suit = huki.substring(0, 1);
      data.trick = huki.substring(1) || null;
      client.sendGameEvent(data);
    }
  });
  this.reset();
};
MeisenUI.prototype.reset = function() {
  this.watching = 0;
  this.paper.clear();
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
  this.paper.canvas.appendChild(svgCards.children[0].cloneNode(true));
  this.paper.canvas.appendChild($('#2_heart', svgCards)[0].cloneNode(true));
};
MeisenUI.prototype.setupPlayer = function(data) {
  var pos = (data.id - this.watching + MEISEN_NUM_PLAYER) % MEISEN_NUM_PLAYER;
  var center = { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2 };
  var rotation = -pos*Math.PI/2;
  var sin = Math.sin(rotation), cos = Math.cos(rotation);
  var x = 0, y = pos * CARD_HEIGHT;
  var player = this.paper.player(data.id, x, y);
  this['player'+data.id] = player;
  for (var c in data.hand) {
    var card = this.paper.card(data.hand[c], 0, 0);
    player.addcard(card);
    card.click(function(){
      this.animate(Raphael.animation({ x: this.x+16, y: this.y+16 }, 100));
    });
  }
};
MeisenUI.prototype.setupAgari = function(data) {
  var x = 0, y = 4 * CARD_HEIGHT;
  var text = this.paper.text(x, y+CARD_HEIGHT/2, 'ア')
  text.attr({'font-size': 24, 'text-anchor': 'start' });
  x += 48;
  var card = this.paper.card(data, x, y);
  this.agari = {
    text: text,
    card: card
  }
};
MeisenUI.prototype.action_setup = function(data) {
  this.paper.clear();
  for (var p in data.players) {
    this.setupPlayer(data.players[p]);
  }
  this.setupAgari(data.agari);
};
MeisenUI.prototype.action_huku = function(data) {
  for (var p in data.players) {
    var data2 = data.players[p];
    var player = this['player'+data2.id];
    if (player) {
      player.huku(data2.huki);
    }
  }
};
MeisenUI.prototype.action_agari = function(data) {
  if (this.agari) {
    this.agari.text.remove();
    this.agari.card.remove();
    this.agari = null;
  }
  for (var p in data.players) {
    var data2 = data.players[p];
    var player = this['player'+data2.id];
    if (player) {
      var card = this.paper.card(data.agari, 0, 0);
      player.addcard(card);
      card.click(function(){
        this.animate(Raphael.animation({ x: this.x+16, y: this.y+16 }, 100));
      });
    }
  }
};
