var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 360;
var CARD_WIDTH = 36;
var CARD_HEIGHT = CARD_WIDTH*14/9;
var svgCards = null;
Raphael.fn.group = function() {
  var el = document.createElementNS("http://www.w3.org/2000/svg", "g");
  this.canvas.appendChild(el);
  var g = new this.raphael.el.constructor(el, this);
  g.type = 'group';
  g.x = g.y = 0;
  delete g.attrs.x;
  delete g.attrs.y;
  Object.defineProperty(g.attrs, 'x', {
    get: function() { return g.x; },
    set: function(value) { g.move(value, g.y); }
  });
  Object.defineProperty(g.attrs, 'y', {
    get: function() { return g.y; },
    set: function(value) { g.move(g.x, value); }
  });
  g.push = Raphael.fn.group.push;
  g.move = Raphael.fn.group.move;
  g.click = Raphael.fn.group.click;
  return g;
};
Raphael.fn.group.push = function(item) {
  if (item.node) {
    if (!this.children) this.children = [];
    this.children.push(item);
    item = item.node;
  }
  this.node.appendChild(item);
};
Raphael.fn.group.move = function(x, y) {
  var dx = x - this.x, dy = y - this.y;
  this.x = x; this.y = y;
  this.translate(dx, dy);
};
Raphael.fn.group.click = function(fn) {
  if (this.children) {
    fn = _.bind(fn, this);
    for (var i = 0, ii = this.children.length; i < ii; i++) {
      this.children[i].click && this.children[i].click(fn);
    }
  }
};
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
  var text = this.paper.text(x, y+CARD_HEIGHT/2, 'p'+data.id)
  text.attr({'font-size': 24, 'text-anchor': 'start' });
  this['player'+data.id] = text;
  x += 48;
  for (var c in data.hand) {
    var card = this.paper.card(data.hand[c], x, y);
    card.click(function(){
      this.animate(Raphael.animation({ x: this.x+16, y: this.y+16 }, 100));
    });
    x += CARD_WIDTH;
  }
};
MeisenUI.prototype.action_setup = function(data) {
  this.paper.clear();
  for (var p in data.players) {
    this.setupPlayer(data.players[p]);
  }
};
