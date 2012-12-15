var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 360;
var CARD_WIDTH = 36;
var CARD_HEIGHT = CARD_WIDTH*14/9;
var IMAGE_CARD_WIDTH = 167.575, IMAGE_CARD_HEIGHT = 243.137;
var CARD_SCALE = Math.min(CARD_WIDTH/IMAGE_CARD_WIDTH, CARD_HEIGHT/IMAGE_CARD_HEIGHT);
var CARD_SCALE_TEXT = 'scale('+CARD_SCALE+')';
var svgCards = null;
function cloneSvgCard(name, id) {
  var image = $('#'+name, svgCards)[0].cloneNode(true);
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  image.id = id || '';
  g.setAttribute('transform', CARD_SCALE_TEXT);
  g.appendChild(image);
  return g;
}
Raphael.fn.card = function(cardid, x, y) {
  var name = CardNames[cardid];
  var card = this.group();
  card.rect = this.rect(0, 0, CARD_WIDTH, CARD_HEIGHT),
  card.text = this.text(4, 16, CardNames.shortName(name))
  //card.image = cloneSvgCard(name);
  //card.node.appendChild(card.image);
  card.push(card.rect);
  card.push(card.text);

  card.rect.attr({fill: "#fff"});
  if (card.image) {
    card.rect.attr({'stroke-opacity': 0, 'fill-opacity': 0});
  }
  card.text.attr({'font-size': 24, 'text-anchor': 'start' });
  card.text.attr({'x': 4, 'y': 16 });

  card.value = cardid;
  card.move(x, y);
  return card;
};
Raphael.fn.player = function(playerid, x, y) {
  var player = this.group();
  player.__proto__ = Raphael.fn.player.proto;
  player.move(x, y);
  player.pid = playerid;
  player.text = this.text(4, 14, 'p'+playerid);
  player.push(player.text);
  player.huki = null;
  player.hand = [];
  player.text.attr({'font-size': 24, 'text-anchor': 'start' });

  return player;
};
Raphael.fn.player.proto = {
  addcard: function(card) {
    var size = this.hand.length;
    this.push(card);
    this.hand.push(card);
    card.move(48+size*CARD_WIDTH, 0);
  },
  removecard: function(cardid) {
    var size = this.hand.length;
    var card = null, cardindex = 0;
    _.each(this.hand, function(val, index) {
      if (card !== null) {
        val.move(48+(index-1)*CARD_WIDTH, 0);
      } else if (val.value == cardid) {
        card = val;
        cardindex = index;
      }
    });
    if (card === null) {
      return null;
    }
    this.exclude(card);
    card.remove();
    this.hand.splice(cardindex, 1);
    return card;
  },
  huku: function(huki) {
    if (this.huki !== null) {
      this.huki.remove();
      this.huki = null;
    }
    if (huki) {
      this.huki = this.paper.text(16, 40, ''+huki)
      this.huki.attr({'font-size': 20, 'text-anchor': 'start' });
      this.push(this.huki);
    }
  },
  __proto__: Raphael.gr
};
Raphael.fn.table = function(x, y) {
  var table = this.group();
  table.move(x, y);
  table.text = this.text(4, 14, '場');
  table.text.attr({'font-size': 24, 'text-anchor': 'start' });
  table.players = [null, null, null, null];
  table.push(table.text);
  table.pos = 0;
  table.setCard = function(playerid, cardid, watching) {
    console.log('setCard: player id:'+playerid+' cardid:'+cardid);
    if (!_.has(this.players, playerid)) {
      return;
    }
    this.clearCard(playerid);
    var pos = (playerid - watching + MEISEN_NUM_PLAYER) % MEISEN_NUM_PLAYER;
    var card = this.paper.card(cardid, this.pos * CARD_WIDTH / 4, pos * (CARD_HEIGHT+8) + 40);
    this.push(card);
    this.players[playerid] = card;
    this.pos++;
  };
  table.clearCard = function(playerid) {
    var card = this.players[playerid];
    if (card) {
      this.exclude(card);
      card.remove();
      this.players[playerid] = null;
    }
  };
  table.clearAll = function() {
    _.each(this.players, function(val, index) {
      this.clearCard(index);
    }, this);
    this.pos = 0;
  };

  return table;
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
  var meisen = this;
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
  $('#game-ack').click(function(){
    if (meisen.state == 'endtrick') {
      for (var id = 0; id < 4; id++) {
        var data = { action: 'ackendtrick', playerid: id };
        client.sendGameEvent(data);
      }
    }
  });
  this.reset();
};
MeisenUI.prototype.reset = function() {
  this.watching = 0;
  this.state = 'init';
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
MeisenUI.prototype.onClickCard = function(card) {
  console.log('click card:', card.value, '/', this.state);
  if (this.state == 'negli') {
    var data = { action: 'negru', card: card.value };
    client.sendGameEvent(data);
    return;
  }
  if (this.state == 'play') {
    var data = { action: 'play', card: card.value };
    client.sendGameEvent(data);
    return;
  }
};
MeisenUI.prototype.action_init = function(data) {
  this.reset();
  this.paper.canvas.appendChild(svgCards.children[0].cloneNode(true));
  this.paper.canvas.appendChild(cloneSvgCard('2_heart'));
};
MeisenUI.prototype.setupPlayer = function(data) {
  var pos = (data.id - this.watching + MEISEN_NUM_PLAYER) % MEISEN_NUM_PLAYER;
  var center = { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2 };
  var rotation = -pos*Math.PI/2;
  var sin = Math.sin(rotation), cos = Math.cos(rotation);
  var x = 0, y = pos * (CARD_HEIGHT+8) + 40;
  var player = this.paper.player(data.id, x, y);
  this['player'+data.id] = player;
  var meisen = this;
  for (var c in data.hand) {
    var card = this.paper.card(data.hand[c], 0, 0);
    player.addcard(card);
    card.click(function(){ meisen.onClickCard(this); });
  }
  if (data.huki) {
    player.huku(data.huki);
  }
};
MeisenUI.prototype.setupAgari = function(data) {
  if (data == null) data = -1;
  var x = 0, y = 4 * (CARD_HEIGHT+8) + 40;
  var text = this.paper.text(x, y+CARD_HEIGHT/2, 'ア')
  text.attr({'font-size': 24, 'text-anchor': 'start' });
  x += 48;
  var card = this.paper.card(data, x, y);
  this.agari = {
    text: text,
    card: card
  }
  card.click(function(){
    this.animate(Raphael.animation({ x: this.x+16, y: this.y+16 }, 100));
  });
};
MeisenUI.prototype.action_setup = function(data) {
  for (var p in data.players) {
    this.setupPlayer(data.players[p]);
  }
  this.setupAgari(data.agari);
  this.state = 'huki';
};
MeisenUI.prototype.action_huku = function(data) {
  for (var p in data.players) {
    var data2 = data.players[p];
    var player = this['player'+data2.id];
    if (player) {
      player.huku(data2.huki);
    }
  }
  this.state = 'huki';
};
MeisenUI.prototype.action_agari = function(data) {
  if (this.agari) {
    this.agari.text.remove();
    this.agari.card.remove();
    this.agari = null;
  }
  var meisen = this;
  for (var p in data.players) {
    var data2 = data.players[p];
    var player = this['player'+data2.id];
    if (player) {
      var card = this.paper.card(data.agari, 0, 0);
      player.addcard(card);
      card.click(function(){ meisen.onClickCard(this); });
    }
  }
  this.state = 'negli';
};
MeisenUI.prototype.setupNegri = function(data) {
  var x = 0, y = 4 * (CARD_HEIGHT+8) + 40;
  var text = this.paper.text(x, y+CARD_HEIGHT/2, 'ネ')
  text.attr({'font-size': 24, 'text-anchor': 'start' });
  x += 48;
  var card = this.paper.card(data, x, y);
  this.agari = {
    text: text,
    card: card
  }
};
MeisenUI.prototype.action_negru = function(data) {
  for (var p in data.players) {
    var data2 = data.players[p];
    var player = this['player'+data2.id];
    if (player) {
      var card = player.removecard(data.negli);
      console.log(card? 'success':'failure');
    }
  }
  this.setupNegri(data.negli);
  this.state = 'play';
  this.table = this.paper.table(48+10*CARD_WIDTH+20, 0);
};
MeisenUI.prototype.action_trick = function(data) {
  this.table.clearAll();
  this.state = 'play';
};
MeisenUI.prototype.action_play = function(data) {
  var player = this['player'+data.player];
  if (player) {
    var card = player.removecard(data.card);
    if (!card) {
      card = player.removecard(-1);
    }
    console.log(card? 'success':'failure');
  }
  this.table.setCard(player.pid, data.card, this.watching);
};
MeisenUI.prototype.action_endtrick = function(data) {
  console.log('win: '+data.current);
  this.state = 'endtrick';
};
MeisenUI.prototype.action_end = function(data) {
  this.state = 'end';
  this.paper.clear();
  this.paper.text('終了', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
};

MeisenUI.prototype.action_load = function(data) {
  console.log('load: ', data);
  if (data.state == null || data.state == 'INIT') {
    this.reset();
    return;
  }
  this.state = data.state.toLowerCase();
  if (this.state == 'ready') {
    this.state = 'huki';
  }
  for (var p in data.players) {
    this.setupPlayer(data.players[p]);
  }
  if (this.state == 'huki') {
    this.setupAgari(data.agari);
  }
  if (data.negli != null) {
    this.setupNegli(data.negli);
  }
  if (data.trick != null) {
    this.table = this.paper.table(48+10*CARD_WIDTH+20, 0);
    for (var i = 0; i < 4; i++) {
      var j = (data.trick.start + i) % 4;
      if (data.trick.table[j] != null) {
        this.table.setCard(j, data.trick.table[j], this.watching);
      }
    }
  }
};
