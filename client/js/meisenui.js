var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 360;
var CARD_WIDTH = 40;
var CARD_HEIGHT = CARD_WIDTH*14/9;
var PPANEL_WIDTH = CARD_WIDTH*11, PPANEL_HEIGHT = CARD_HEIGHT+27;
var IMAGE_CARD_WIDTH = 167.575, IMAGE_CARD_HEIGHT = 243.137;
var CARD_SCALE = Math.min(CARD_WIDTH/IMAGE_CARD_WIDTH, CARD_HEIGHT/IMAGE_CARD_HEIGHT);
var CARD_SCALE_TEXT = 'scale('+CARD_SCALE+')';
var CARD_COLORS = {
  s: '#000000', c: '#000000', d: '#E6180A', h: '#E6180A',
  n: '#666666', j: '#000000',
};
var svgCards = null;
var meisen = null;
function cloneSvgCard(name, id) {
  var image = $('#'+name, svgCards)[0].cloneNode(true);
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  image.id = '';
  g.setAttribute('transform', CARD_SCALE_TEXT);
  g.appendChild(image);
  id && (g.id = id);
  return g;
}
function cloneSvgMark(name, id) {
  var image = $('#m_'+name, svgCards)[0].cloneNode(true);
  image.id = id || '';
  return image;
}
Raphael._availableAttrs['font'] = '22px "Arial"';
Raphael._availableAttrs['font-size'] = '22px';
Raphael.fn.card = function(cardid, x, y) {
  var name = CardNames[cardid];
  var card = this.group();
  //card.image = cloneSvgCard(name);
  if (card.image) {
    card.node.appendChild(card.image);
  }
  card.rect = this.rect(0, 0, CARD_WIDTH, CARD_HEIGHT),
  card.rect.attr({fill: "#fff"});
  card.push(card.rect);
  if (cardid != -1) {
    var shortname = CardNames.shortName(name);
    card.text = this.text(4, 16, shortname);
    card.push(card.text);
    var color = CARD_COLORS[shortname.charAt(0)];
    card.text.attr({'text-anchor': 'start', fill: color});
    card.text.attr({'x': 4, 'y': 16 });
  } else {
    card.rect.attr({fill: "#9af"});
  }

  if (card.image) {
    card.rect.attr({'opacity': 0});
    if (card.text) {
      card.text.attr({'opacity': 0});
    }
  }

  card.value = cardid;
  card.move(x, y);
  card.click(Raphael.fn.card.onClick);
  return card;
};
Raphael.fn.card.onClick = function(){ meisen.onClickCard(this); };
Raphael.fn.player = function(playerid, x, y) {
  var player = this.group();
  player.__proto__ = Raphael.fn.player.proto;
  player.move(x, y);
  player.pid = playerid;
  player.text = this.text(4, 9, 'NoName');
  player.push(player.text);
  player.huki = null;
  player.hand = [];
  player.text.attr({'text-anchor': 'start' });
  player.text.click(function() { meisen.onClickSeat(player.pid); });

  return player;
};
Raphael.fn.player.proto = {
  updateName: function(name) {
    this.text.attr('text', name || '<席に着く>');
    if (this.huki) {
      var x = 16;
      if (this.text) {
        var bbox = this.text.getBBox();
        x = bbox.x + bbox.width + 16;
      }
      this.huki.attr({'x': x});
    }
  },
  updateHand: function(hand) {
    while(this.hand.length) {
      var card = this.hand.pop();
      this.exclude(card);
      card.remove();
    }
    hand.sort(function(a,b) {
      if (a >= 52 || (a%13) == 0) a += 13;
      if (b >= 52 || (b%13) == 0) b += 13;
      return a-b;
    });
    _.each(hand, function(value) {
      var card = this.paper.card(value, 0, 0);
      this.addcard(card);
    }, this);
  }
  cardpos: function(card, x) {
    card.move(x*CARD_WIDTH, PPANEL_HEIGHT-CARD_HEIGHT);
  },
  addcard: function(card) {
    var size = this.hand.length;
    this.push(card);
    this.hand.push(card);
    this.cardpos(card, size);
  },
  removecard: function(cardid) {
    var size = this.hand.length;
    var card = null, cardindex = 0;
    _.each(this.hand, function(val, index) {
      if (card !== null) {
        this.cardpos(val, index-1);
      } else if (val.value == cardid) {
        card = val;
        cardindex = index;
      }
    }, this);
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
      var bbox = this.text.getBBox();
      this.huki = this.paper.text(bbox.x + bbox.width + 16, 9, ''+huki)
      this.huki.attr({'font-size': '18px', 'text-anchor': 'start' });
      this.push(this.huki);
    }
  },
  highlight: function(on) {
    if (on) {
      var width = Math.max(this.hand.length, 10)*CARD_WIDTH;
      if (!this._highlight) {
        this._highlight = this.paper.rect(0, 0, width, PPANEL_HEIGHT);
        this._highlight.attr({'stroke': '#00f', 'stroke-width':'2px', 'fill':'#ccf'});
        this.push(this._highlight);
        this._highlight.toBack();
      } else {
        this._highlight.attr({'width': width});
      }
    } else {
      if (this._highlight) {
        this._highlight.remove();
        this._highlight = null;
      }
    }
  },
  __proto__: Raphael.gr
};
Raphael.fn.table = function(x, y) {
  var table = this.group();
  table.move(x, y);
  table.players = [null, null, null, null];
  table.pos = 0;
  table.setCard = function(playerid, cardid, watching) {
    if (!_.has(this.players, playerid)) {
      return;
    }
    this.clearCard(playerid);
    var cardpos = (playerid - watching + MEISEN_NUM_PLAYER) % MEISEN_NUM_PLAYER;
    var pos = [
      {x:-CARD_WIDTH/2,   y: CARD_HEIGHT/4  },
      {x: CARD_WIDTH/2,   y:-CARD_HEIGHT/2  },
      {x:-CARD_WIDTH/2,   y:-CARD_HEIGHT*5/4},
      {x:-CARD_WIDTH*3/2, y:-CARD_HEIGHT/2  },
    ];
    var card = this.paper.card(cardid, pos[cardpos].x, pos[cardpos].y);
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
  meisen = this;
  this.canvas = null;
  this.paper = null;
  this.state = null;
  this.hukiPanel = null;
  this.table = null;
  this.watching = 0;
  this.playernames = [null, null, null, null];
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
    client.sendGameEvent({ action: 'init', player: meisen.watching });
  });
  $('#game-setup').click(function(){
    client.sendGameEvent({ action: 'setup', player: meisen.watching });
  });
  $('#game-huku').click(function(){
    var huki = $('#input-huki').val();
    if (huki.length >= 1) {
      var data = { action: 'huku', player: meisen.watching };
      data.suit = huki.substring(0, 1);
      data.trick = huki.substring(1) || null;
      client.sendGameEvent(data);
    }
  });
  $('#game-ack').click(function(){
    if (meisen.state == 'endtrick') {
      var data = { action: 'ackendtrick', player: meisen.watching };
      client.sendGameEvent(data);
    }
  });
  this.reset();
};
MeisenUI.prototype.reset = function() {
  this.state = 'init';
  this.hukiPanel = null;
  this.table = null;
  for (var i = 0; i < 4; i++) {
    this['player'+i] = null;
  }
  this.paper.clear();
  this.paper.canvas.appendChild(svgCards.children[0].cloneNode(true));
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
  if (this.state == 'negli') {
    var data = { action: 'negru', player: meisen.watching, card: card.value };
    client.sendGameEvent(data);
    return;
  }
  if (this.state == 'play') {
    var data = { action: 'play', player: meisen.watching, card: card.value };
    client.sendGameEvent(data);
    return;
  }
};
MeisenUI.prototype.onClickSeat = function(playerid) {
  this.setWatching(playerid);
  if (this.playernames[playerid] === null) {
    var data = { action: 'seat', pos: playerid };
    client.sendGameEvent(data);
  }
};
MeisenUI.prototype.onClickHuki = function(huki) {
  if (this.state == 'huki') {
    var data = {
      action: 'huku', player: meisen.watching,
      suit: huki.suit, trick: huki.trick
    };
    client.sendGameEvent(data);
    return;
  }
};
var MEISEN_PLAYER_POS = [
  { x: (CANVAS_WIDTH-PPANEL_WIDTH)/2, y: CANVAS_HEIGHT-PPANEL_HEIGHT-2, s: 1, r: 0 },
  { x: CANVAS_WIDTH-PPANEL_HEIGHT*0.6-2, y: PPANEL_WIDTH*0.56+8, s: 0.56, r: 90 },
  { x: (CANVAS_WIDTH+PPANEL_WIDTH*0.6)/2, y: PPANEL_HEIGHT*0.6+2, s: 0.6, r: 180 },
  { x: PPANEL_HEIGHT*0.56+2, y: 8, s: 0.56, r: 270 },
];
MeisenUI.prototype.setCurrentPlayer = function(playerid) {
  var prev = this.current;
  if (playerid != null) {
    this.current = this['player'+playerid];
    this.current.highlight(true);
  } else {
    this.current = null;
  }
  if (prev && prev !== this.current) {
    prev.highlight(false);
  }
};
MeisenUI.prototype.setupPlayer = function(data) {
  if (!this['player'+data.id] || this['player'+data.id].removed) {
    this['player'+data.id] = this.paper.player(data.id, 0, 0);
  }
  var relpos = (data.id - this.watching + MEISEN_NUM_PLAYER) % MEISEN_NUM_PLAYER;
  var player = this['player'+data.id];
  var pos = MEISEN_PLAYER_POS[relpos];
  player.transform('');
  player.move(pos.x, pos.y);
  player.rotate(-pos.r, 0, 0);
  player.scale(pos.s, pos.s, 0, 0);
  player.updateName(this.playernames[data.id]);
  player.updateHand(data.hand);
  if (data.huki) {
    player.huku(data.huki);
  }
};
MeisenUI.prototype.updatePlayerName = function(playerid, name) {
  this.playernames[playerid] = name;
  if (this['player'+playerid]) {
    this['player'+playerid].updateName(name);
  }
};
MeisenUI.prototype.setupAgari = function(data) {
  if (this.agari) {
    this.agari.remove();
  }
  if (data == null) data = -1;
  var x = (CANVAS_WIDTH-CARD_WIDTH)/2+120, y = CANVAS_HEIGHT/2-CARD_HEIGHT;
  var card = this.paper.card(data, x, y);
  this.agari = card;
};
MeisenUI.prototype.setupNegli = function(data) {
  var x = CANVAS_WIDTH-CARD_WIDTH-8, y = CANVAS_HEIGHT-CARD_HEIGHT-8;
  var card = this.paper.card(data, x, y);
  this.card = card;
};
MeisenUI.prototype.setupHukiList = function(data) {
  if (this.hukiPanel) {
    this.hukiPanel.remove();
  }
  var w = 44, h = 28;
  this.hukiPanel = this.paper.group();
  this.hukiPanel.move((CANVAS_WIDTH-w*6)/2 - CARD_WIDTH, (CANVAS_HEIGHT-h*6)/2 - 8);
  var meisen = this;
  var func = function(){ meisen.onClickHuki(this); };
  var pass = this.paper.text(24, 5, 'Pass');
  pass.suit = 'p';
  pass.trick = null;
  pass.attr({fill:'#009900'});
  pass.click(func);
  this.hukiPanel.push(pass);
  var broken = this.paper.text(90, 5, 'Broken');
  broken.suit = 'b';
  broken.trick = null;
  broken.attr({fill:'#dd4444'});
  broken.click(func);
  this.hukiPanel.push(broken);
  _.each(['spade', 'club', 'diamond', 'heart', 'notr'], function(suit, y) {
    var color = CARD_COLORS[suit.charAt(0)];
    _.each(['6', '7', '8', '9', '10', '11'], function(trick, x) {
      var g = this.paper.group();
      g.move(x*w, (y+1)*h);
      g.suit = suit.substring(0, 1);
      g.trick = trick;
      g.node.appendChild(cloneSvgMark(suit));
      g.rect = this.paper.rect(-2, -6, w, h);
      g.text = this.paper.text(26, 8, ''+trick);
      g.push(g.rect);
      g.push(g.text);
      g.rect.attr({fill:'#fff', opacity:0});
      g.text.attr({fill:color});
      g.click(func);
      this.hukiPanel.push(g);
    }, this);
  }, this);
};
MeisenUI.prototype.setupTable = function(data) {
  if (!this.table || this.table.removed) {
    this.table = this.paper.table(CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
  }
  this.table.clearAll();
  if (data) {
    for (var i = 0; i < 4; i++) {
      var j = (data.start + i) % 4;
      if (data.table[j] != null) {
        this.table.setCard(j, data.table[j], this.watching);
      }
    }
  }
};
MeisenUI.prototype.setupEnd = function(data) {
  this.paper.clear();
  this.paper.text(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, '終了');
};
MeisenUI.prototype.setWatching = function(pos) {
  this.watching = pos;
  for (var i = 0; i < 4; i++) {
    var relpos = (i - this.watching + MEISEN_NUM_PLAYER) % MEISEN_NUM_PLAYER;
    var pos = MEISEN_PLAYER_POS[relpos];
    var player = this['player'+i];
    if (player) {
      player._.transform = [];
      player.x = player.y = 0;
      player.move(pos.x, pos.y);
      player.rotate(-pos.r, 0, 0);
      player.scale(pos.s, pos.s, 0, 0);
    }
  }
};
MeisenUI.prototype.action_init = function() {
  this.reset();
  for (var i = 0; i < 4; i++) {
    this.setupPlayer({ id:i, hand:[], huki:null});
  }
};
MeisenUI.prototype.action_setup = function(data) {
  for (var p in data.players) {
    this.setupPlayer(data.players[p]);
  }
  this.setupAgari(data.agari);
  this.setupHukiList(data);
  this.state = 'huki';
};
MeisenUI.prototype.action_huki = function(data) {
  this.setCurrentPlayer(data.current);
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
    this.agari.remove();
    this.agari = null;
  }
  if (this.hukiPanel) {
    this.hukiPanel.remove();
    this.hukiPanel = null;
  }
  var player = this['player'+data.player];
  if (player) {
    var card = this.paper.card(data.card, 0, 0);
    player.addcard(card);
  }
  this.state = 'negli';
  this.setCurrentPlayer(data.current);
};
MeisenUI.prototype.action_negru = function(data) {
  var player = this['player'+data.player];
  if (player) {
    var card = player.removecard(data.card);
    if (!card) {
      if (data.card != -1) {
        card = player.removecard(-1);
      } else {
        var x = [];
        for (var i = 0, ii = player.hand.length-1; i < ii; i++) {
          x[i] = -1;
        }
        player.updateHand(x);
      }
    }
  }
  this.setupNegli(data.card);
  this.setupTable(null);
  this.state = 'play';
};
MeisenUI.prototype.action_trick = function(data) {
  this.table.clearAll();
  this.state = 'play';
  this.setCurrentPlayer(data.current);
};
MeisenUI.prototype.action_play = function(data) {
  var player = this['player'+data.player];
  if (player) {
    var card = player.removecard(data.card);
    if (!card) {
      card = player.removecard(-1);
    }
  }
  this.table.setCard(player.pid, data.card, this.watching);
  this.setCurrentPlayer(data.current);
};
MeisenUI.prototype.action_endtrick = function(data) {
  console.log('win: '+data.current);
  this.state = 'endtrick';
  this.setCurrentPlayer(data.current);
};
MeisenUI.prototype.action_end = function(data) {
  this.state = 'end';
  this.setupEnd();
};

MeisenUI.prototype.action_seat = function(data) {
  if (_.has(data, 'pos') && _.has(data, 'name') && _.has(this.playernames, data.pos)) {
    this.updatePlayerName(data.pos, data.name);
  }
  for (var i = 0; i < 4; i++) {
    if (_.has(data, i)) {
      this.updatePlayerName(i, data[i]);
    }
  }
};
MeisenUI.prototype.action_load = function(data) {
  if (data.state == null || data.state == 'INIT') {
    this.action_init();
    return;
  }
  this.state = data.state.toLowerCase();
  if (this.state == 'ready') {
    this.state = 'huki';
  }
  if (this.state == 'end') {
    this.setupEnd();
    return;
  }
  for (var p in data.players) {
    this.setupPlayer(data.players[p]);
  }
  if (this.state == 'huki') {
    this.setupAgari(data.agari);
    this.setupHukiList(data);
  }
  if (data.negli != null) {
    this.setupNegli(data.negli);
  }
  if (data.trick != null) {
    this.setupTable(data.trick);
  }
  if (data.current != null) {
    this.setCurrentPlayer(data.current);
  }
};
