var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 360;
var CARD_WIDTH = 40;
var CARD_HEIGHT = CARD_WIDTH*14/9;
var PPANEL_WIDTH = CARD_WIDTH*11, PPANEL_HEIGHT = CARD_HEIGHT+32;
var IMAGE_CARD_WIDTH = 167.575, IMAGE_CARD_HEIGHT = 243.137;
var CARD_SCALE = Math.min(CARD_WIDTH/IMAGE_CARD_WIDTH, CARD_HEIGHT/IMAGE_CARD_HEIGHT);
var CARD_SCALE_TEXT = 'scale('+CARD_SCALE+')';
var CARD_COLORS = {
  s: '#000000', c: '#000000', d: '#E6180A', h: '#E6180A',
  n: '#3f3f3f', j: '#000000', p: '#00BB00'
};
var KIRIHUDA_TEXT = {
  c: 'クラブ', s: 'スペード', h: 'ハート', d: 'ダイア', n: 'なし'
};
var TABLE_CARD_POS = [
  {x:-CARD_WIDTH/2, y: CARD_HEIGHT/4  },
  {x: CARD_WIDTH,   y:-CARD_HEIGHT/2  },
  {x:-CARD_WIDTH/2, y:-CARD_HEIGHT*5/4},
  {x:-CARD_WIDTH*2, y:-CARD_HEIGHT/2  },
];
var SUIT_UNICODE = { s:'♠', c:'♣', d:'♦', h:'♥', n:'N' };
var PLAYER_SCALE_END = 0.7;

var svgCards = null;
var svgMarks = null;
var meisen = null;
var CardImageMode = 'text';
function cloneSvgCard(name, id) {
  var image = $('#'+name, svgCards)[0].cloneNode(true);
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  image.id = '';
  g.setAttribute('transform', CARD_SCALE_TEXT);
  g.appendChild(image);
  id && (g.id = id);
  return g;
}
function cloneSvgMark(name, id, x, y) {
  var image = $('#m_'+name, svgMarks)[0].cloneNode(true);
  image.id = id || '';
  if (x || y) {
    image.setAttribute('transform', 'translate('+x+','+y+')');
  }
  return image;
}
Raphael._availableAttrs['font'] = '22px "Arial"';
Raphael._availableAttrs['font-size'] = '22px';
Raphael.fn.card = function(cardid, x, y) {
  var card = this.group();
  card.rect = this.rect(0, 0, CARD_WIDTH-1, CARD_HEIGHT-1),
  card.rect.attr({'stroke': '#555'});
  card.push(card.rect);
  card.setValue = Raphael.fn.card.setValue;
  card.setFrame = Raphael.fn.card.setFrame;

  this.value = -1;
  card.setValue(cardid);
  card.move(x, y);
  card.click(Raphael.fn.card.onClick);
  return card;
};
Raphael.fn.card.setValue = function(cardid) {
  var name = CardNames[cardid];
  var text = null;
  if (CardImageMode === 'text') {
    if (cardid == -1) {
      this.rect.attr({fill: "#9af", 'opacity': 1});
    } else {
      this.rect.attr({fill: '#fff', 'opacity': 1});
      if (cardid < 52) {
        text = name.rank.toUpperCase();
        if (text.length > 2) text = text.charAt(0);
        if (text == '1') text = 'A';
        text = SUIT_UNICODE[name.suit.charAt(0)] + text;
      } else {
        text = name.shortName();
      }
    }
  } else {
    this.rect.attr({fill: '#fff', 'opacity': 0});
  }
  if (text) {
    if (!this.text) {
      this.text = this.paper.text(CARD_WIDTH/2, CARD_HEIGHT/3, '');
      this.push(this.text);
    }
    var color = CARD_COLORS[name.suit.charAt(0)];
    this.text.attr({'text': text, 'fill': color});
  } else if (this.text) {
    this.exclude(this.text);
    this.text.remove();
    this.text = null;
  }

  if (cardid == -1) {
    this.rect.attr({fill: "#9af", 'opacity': 1});
  }
  if (CardImageMode === 'svg' && cardid != -1) {
    if (this.image && this.value != cardid) {
      this.node.removeChild(this.image);
      this.image = null;
    }
    this.image = cloneSvgCard(name.name);
    this.node.insertBefore(this.image, this.node.firstChild);
  } else if (this.image) {
    this.node.removeChild(this.image);
    this.image = null;
  }
  if (CardImageMode === 'img') {
    // TODO
  }

  this.value = cardid;
}
Raphael.fn.card.setFrame = function(color) {
  if (!color) {
    if (this.frame) {
      this.exclude(this.frame);
      this.frame.remove();
      this.frame = null;
    }
    return;
  }
  if (!this.frame) {
    this.frame = this.paper.rect(0.5, 0.5, CARD_WIDTH-2, CARD_HEIGHT-2);
    this.push(this.frame);
  }
  this.frame.attr({'stroke': color, 'stroke-width': '2px'});
};
Raphael.fn.card.onClick = function(){ meisen.onClickCard(this); };
Raphael.fn.player = function(playerid, x, y) {
  var player = this.group();
  player.__proto__ = Raphael.fn.player.proto;
  player.move(x, y);
  player.pid = playerid;
  player.text = this.text(4, 17, 'NoName');
  player.push(player.text);
  player.huki = null;
  player.hand = [];
  player.tricks = [];
  player.text.attr({'text-anchor':'start'});
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
  },
  updateTrickCount: function(count) {
    while (this.tricks.length > count) {
      var card = this.tricks.pop();
      this.exclude(card);
      card.remove();
    }
    while (this.tricks.length < count) {
      var x = CARD_WIDTH*10 - CARD_WIDTH*0.6*(this.tricks.length+1);
      var card = this.paper.card(-1, x, 4);
      card.scale(0.4, 0.4, 0, 0);
      this.tricks.push(card);
      this.push(card);
    }
  },
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
    if (huki) {
      var bbox = this.text.getBBox();
      var color = CARD_COLORS[huki.charAt(0)];
      if (huki == 'p') {
        huki = 'Pass';
      } else {
        var suit = huki.charAt(0);
        var trick = huki.substr(1);
        huki = SUIT_UNICODE[suit] + trick;
      }
      if (!this.huki) {
        this.huki = this.paper.text(16, 20, '')
        this.huki.attr({'font-size': '16px', 'text-anchor': 'start'});
      }
      this.huki.attr({'x': (bbox.x+bbox.width+16),'fill':color,'text':huki});
      this.push(this.huki);
    } else {
      if (this.huki !== null) {
        this.huki.remove();
        this.huki = null;
      }
    }
  },
  highlight: function(on) {
    if (on) {
      if (!this._highlight) {
        this._highlight = this.paper.rect(0, 0, 10*CARD_WIDTH, PPANEL_HEIGHT);
        this._highlight.attr({'stroke': '#00f', 'stroke-width':'2px', 'fill':'#ccf'});
        this.push(this._highlight);
        this._highlight.toBack();
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
    var card = this.paper.card(cardid, 0, 0);
    this.push(card);
    this.players[playerid] = card;
    if (this.pos == 0) {
      card.setFrame('#00BB00');
    }
    this.setCardPos(playerid, watching);
    this.pos++;
  };
  table.setCardPos = function(playerid, watching) {
    var cardpos = (playerid - watching + MEISEN_NUM_PLAYER) % MEISEN_NUM_PLAYER;
    var pos = TABLE_CARD_POS[cardpos];
    card = this.players[playerid];
    if (card) {
      card.attr(pos);
    }
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
  this.head = null;
  this.kirihuda = null;
  this.table = null;
  this.btnAck = null;
  this.watching = 0;
  this.playernames = [null, null, null, null];
  this.onClickSetup = MeisenUI.onClickSetup(this);
  this.onClickAck = MeisenUI.onClickAck(this);
}
MeisenUI.onClickSetup = function(meisen) {
  return function(){
    client.sendGameEvent({ action: 'setup', player: meisen.watching });
  };
};
MeisenUI.onClickAck = function(meisen) {
  return function(){
    if (meisen.state == 'endtrick') {
      var data = { action: 'ackendtrick', player: meisen.watching };
      client.sendGameEvent(data);
    }
    if (meisen.state == 'result') {
      var data = { action: 'ackresult', player: meisen.watching };
      client.sendGameEvent(data);
    }
  };
};
MeisenUI.prototype.onResize = function() {
  var width = this.canvas.width(), height = this.canvas.height();
  this.paper.changeSize(width, height, true, true);
};
MeisenUI.prototype.init = function() {
  svgCards = $('svg', $('#svg-cards')[0].contentDocument)[0];
  svgMarks = $('svg', $('#svg-marks')[0].contentDocument)[0];
  var group = svgCards.firstElementChild.nextElementSibling;
  for (var g = group.firstElementChild; g != null; g = g.nextElementSibling) {
    var x = g.firstElementChild.getAttribute('x'), y = g.firstElementChild.getAttribute('y');
    var t = 'translate('+(-x)+','+(236-y)+')';
    g.setAttribute('transform', t);
  }
  this.canvas = $('#canvas');
  var width = this.canvas.width(), height = this.canvas.height();
  this.paper = ScaleRaphael('canvas', CANVAS_WIDTH, CANVAS_HEIGHT);
  var meisen = this;
  $(window).resize(_.bind(this.onResize, this));
  $('#game-init').click(function(){
    client.sendGameEvent({ action: 'init', player: meisen.watching });
  });
  this.reset();
};
MeisenUI.prototype.reset = function() {
  this.state = 'init';
  this.hukiPanel = null;
  this.head = null;
  this.kirihuda = null;
  this.table = null;
  for (var i = 0; i < 4; i++) {
    this['player'+i] = null;
  }
  this.result = null;
  this.btnAck = null;
  this.btnSetup = null;
  this.paper.clear();
  this.paper.canvas.appendChild(svgCards.firstElementChild.cloneNode(true));
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
    var data = { action: 'negru', player: this.watching, card: card.value };
    client.sendGameEvent(data);
    return;
  }
  if (this.state == 'play') {
    var data = { action: 'play', player: this.watching, card: card.value };
    client.sendGameEvent(data);
    return;
  }
};
MeisenUI.prototype.onClickSeat = function(playerid) {
  this.setWatching(playerid);
  if (this.playernames[playerid] === null) {
    var data = { action: 'seat', pos: playerid };
    client.sendGameEvent(data);
  } else if (this.playernames[playerid] === client.name)  {
    var data = { action: 'seat', pos: playerid, clear:true };
    client.sendGameEvent(data);
  }
};
MeisenUI.prototype.onClickHuki = function(huki) {
  if (this.state == 'huki') {
    var data = {
      action: 'huku', player: meisen.current.pid,
      suit: huki.suit, trick: huki.trick
    };
    client.sendGameEvent(data);
    return;
  }
};
var MEISEN_PLAYER_POS = [
  { x: (CANVAS_WIDTH-PPANEL_WIDTH)/2, y: CANVAS_HEIGHT-PPANEL_HEIGHT-3, s: 1, r: 0 },
  { x: CANVAS_WIDTH-PPANEL_HEIGHT*0.56-2, y: PPANEL_WIDTH*0.56+8, s: 0.56, r: 90 },
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
  if (!this['player'+data.id]) {
    this['player'+data.id] = this.paper.player(data.id, 0, 0);
  }
  var player = this['player'+data.id];
  this.setPlayerPos(data.id);
  player.updateName(this.playernames[data.id]);
  player.updateHand(data.hand);
  if (data.huki && (this.state == 'huki' || data.id == this.head)) {
    player.huku(data.huki);
  }
};
MeisenUI.prototype.setPlayerPos = function(playerid) {
  var relpos = (playerid - this.watching + MEISEN_NUM_PLAYER) % MEISEN_NUM_PLAYER;
  var player = this['player'+playerid];
  var pos = MEISEN_PLAYER_POS[relpos];
  if (player) {
    player.transform('');
    player.x = player.y = 0;
    player.move(pos.x, pos.y);
    player.rotate(-pos.r, 0, 0);
    player.scale(pos.s, pos.s, 0, 0);
  }
};
MeisenUI.prototype.updatePlayerName = function(playerid, name) {
  this.playernames[playerid] = name;
  if (this['player'+playerid]) {
    this['player'+playerid].updateName(name);
  }
};
MeisenUI.prototype.updateTrickCount = function(tricks) {
  var trickcounts = [0, 0, 0, 0];
  _.each(tricks, function(trick) {
    trickcounts[trick.playerid]++;
  });
  _.each(trickcounts, function(count, index) {
    this['player'+index].updateTrickCount(count);
  }, this);
};
MeisenUI.prototype.setupAgari = function(data) {
  if (this.agari) {
    this.agari.remove();
    this.agari = null;
  }
  if (data == null) data = -1;
  var x = (CANVAS_WIDTH-CARD_WIDTH)/2+144, y = CANVAS_HEIGHT/2-CARD_HEIGHT;
  if (this.state == 'result') {
    x = PPANEL_WIDTH*PLAYER_SCALE_END+8;
    y = (PPANEL_HEIGHT-CARD_HEIGHT)*PLAYER_SCALE_END;
  }
  var card = this.paper.card(data, x, y);
  card.scale(PLAYER_SCALE_END, PLAYER_SCALE_END, 0, 0);
  this.agari = card;
};
MeisenUI.prototype.setupNegli = function(data) {
  if (this.negli) {
    this.negli.remove();
  }
  if (data == null) data = -1;
  var x = CANVAS_WIDTH-CARD_WIDTH-8, y = CANVAS_HEIGHT-CARD_HEIGHT-8;
  if (this.state == 'result') {
    x = (PPANEL_WIDTH+CARD_WIDTH)*PLAYER_SCALE_END+20;
    y = (PPANEL_HEIGHT-CARD_HEIGHT)*PLAYER_SCALE_END;
  }
  var card = this.paper.card(data, x, y);
  card.scale(PLAYER_SCALE_END, PLAYER_SCALE_END, 0, 0);
  this.negli = card;
};
MeisenUI.prototype.setupHukiList = function(data) {
  if (this.hukiPanel) {
    this.hukiPanel.remove();
  }
  var w = 48, h = 28;
  this.hukiPanel = this.paper.group();
  this.hukiPanel.move((CANVAS_WIDTH-w*6 - CARD_WIDTH)/2, PPANEL_HEIGHT*0.6+CARD_HEIGHT*0.4);
  var meisen = this;
  var func = function(){ meisen.onClickHuki(this); };
  var pass = this.paper.text(24, 5, 'Pass');
  pass.suit = 'p';
  pass.trick = null;
  pass.attr({fill:'#00BB00'});
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
      g.text = this.paper.text(30, 8, ''+trick);
      g.push(g.rect);
      g.push(g.text);
      g.rect.attr({fill:'#fff', opacity:0});
      g.text.attr({fill:color});
      g.click(func);
      this.hukiPanel.push(g);
    }, this);
  }, this);
};
MeisenUI.prototype.updateHukiList = function(huki) {
  if (huki) {
    _.each(this.hukiPanel.children, function(g) {
      if (g.suit && g.trick && !g.disabled) {
        if (g.trick < huki.trick || (g.trick == huki.trick && MEISEN_SUIT_ORDER.indexOf(g.suit) <= huki.suitOrder)) {
          g.disabled = true;
          g.attr({opacity:0.6});
        }
      }
    });
  }
};
MeisenUI.prototype.setupKirihuda = function(data) {
  if (!data) {
    if (this.kirihuda) {
      this.kirihuda.remove();
      this.kirihuda = null;
    }
    return;
  }
  if (!this.kirihuda) {
    this.kirihuda = this.paper.text(PPANEL_HEIGHT*0.56+12, PPANEL_HEIGHT*0.6+12, '');
    this.kirihuda.attr({'font-size': '16px', 'text-anchor': 'start'});
  }
  if (data.suitStr && KIRIHUDA_TEXT[data.suitStr.charAt(0)]) {
    this.kirihuda.attr('text', '切り札：'+KIRIHUDA_TEXT[data.suitStr.charAt(0)]);
  }
};
MeisenUI.prototype.setupTable = function(data) {
  if (!this.table) {
    this.table = this.paper.table(CANVAS_WIDTH/2, CANVAS_HEIGHT/2-CARD_HEIGHT*0.2);
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
  var playernames = [];
  if (this.hukiPanel) {
    this.hukiPanel.remove();
    this.hukiPanel = null;
  }
  if (this.table) {
    this.table.remove();
    this.table = null;
  }
  if (this.kirihuda) {
    this.kirihuda.remove();
    this.kirihuda = null;
  }
  this.setCurrentPlayer(null);
  for (var i = 0; i < 4; i++) {
    playernames[i] = this.playernames[i] || ('Player '+i);
    var player = this['player'+i];
    if (player) {
      player.transform('');
      player.x = player.y = 0;
      player.move(0, i * (PPANEL_HEIGHT+8) * PLAYER_SCALE_END);
      player.scale(PLAYER_SCALE_END, PLAYER_SCALE_END, 0, 0);
      player.updateHand([]);
      player.updateName(playernames[i]);
    }
  }
  _.each(data.tricks, function(trick, index) {
    for (var i = 0; i < 4; i++) {
      var player = this['player'+i];
      if (player) {
        var card = this.paper.card(trick.table[i], 0, 0);
        player.addcard(card);
        if (i == trick.start || i == trick.playerid) {
          card.setFrame(i == trick.playerid?'#FF0000':'#00BB00');
        }
      }
    }
  }, this);
  if (!this.result) {
    this.result = this.paper.group();
    this.result.move(PPANEL_WIDTH*PLAYER_SCALE_END, PPANEL_HEIGHT*PLAYER_SCALE_END+48);
  }
  for (var p = 0; p < 2; p++) {
    var pt = 0, pts = data.players[p].points/2;
    if (p == this.head%2) {
      if (data.point > 0) pt = +data.point/2;
    } else {
      if (data.point < 0) pt = -data.point/2;
    }
    var t = playernames[p] + ' &\n'+playernames[p+2] +
            '\n　+' + pt + ' => ' + pts;
    var text = this.result['pair'+p];
    if (!text) {
      this.result['pair'+p] = text = this.paper.text(0, 96*p, '');
      this.result.push(text);
    }
    text.attr({'text-anchor': 'start', 'text': t});
  }
  if (this.btnAck) {
    this.btnAck.remove();
    this.btnAck = null;
  }
  this.btnAck = this.paper.text(430, 320, 'OK');
  this.btnAck.click(this.onClickAck);
};
MeisenUI.prototype.setWatching = function(pos) {
  this.watching = pos;
  if (this.state != 'result') {
    for (var i = 0; i < 4; i++) {
      this.setPlayerPos(i);
      if (this.table) {
        this.table.setCardPos(i, pos);
      }
    }
  }
};
MeisenUI.prototype.action_init = function() {
  this.reset();
  for (var i = 0; i < 4; i++) {
    this.setupPlayer({ id:i, hand:[], huki:null});
  }
  if (!this.btnSetup) {
    this.btnSetup = this.paper.text(352, 234, '開始');
    this.btnSetup.click(this.onClickSetup);
  }
};
MeisenUI.prototype.action_setup = function(data) {
  this.reset();
  this.state = 'setup';
  if (this.btnSetup) {
    this.btnSetup.remove();
    this.btnSetup = null;
  }
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
  if (data.huki) {
    this.updateHukiList(data.huki);
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
  this.head = data.current;
  for (var i = 0; i < 4; i++) {
    if (i != this.head) {
      this['player'+i].huku(null);
    }
  }
  var player = this['player'+data.player];
  if (player) {
    var card = this.paper.card(data.card, 0, 0);
    player.addcard(card);
  }
  this.state = 'negli';
  this.setupKirihuda(data.huki);
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
  this.state = 'endtrick';
  this.setCurrentPlayer(data.current);
  var card = this.table.players[data.current];
  card && card.setFrame('#FF0000');
  if (this.btnAck) {
    this.btnAck.remove();
    this.btnAck = null;
  }
  this.btnAck = this.paper.text(352, 234, 'OK');
  this.btnAck.click(this.onClickAck);
};
MeisenUI.prototype.action_endendtrick = function(data) {
  this.setCurrentPlayer(data.current);
  if (this.btnAck) {
    this.btnAck.remove();
    this.btnAck = null;
  }
  var player = this['player'+data.current];
  if (player) {
    player.updateTrickCount(player.tricks.length+1);
  }
};
MeisenUI.prototype.action_result = function(data) {
  this.state = 'result';
  this.setupAgari(data.agari);
  this.setupNegli(data.negli);
  this.setupEnd(data);
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
  if (this.state == 'end') this.state = 'result';
  if (data.huki != null) {
    this.head = data.huki.id;
  }
  for (var p in data.players) {
    this.setupPlayer(data.players[p]);
  }
  if (this.state == 'ready') {
    this.state = 'huki';
  }
  if (this.state == 'huki') {
    this.setupAgari(data.agari);
    this.setupHukiList(data);
    if (data.huki) {
      this.updateHukiList(data.huki);
    }
  }
  if (this.state == 'play') {
    this.setupKirihuda(data.huki);
  }
  if (this.state == 'result') {
    this.setupAgari(data.agari);
    this.setupEnd(data);
  }
  if (data.negli != null) {
    this.setupNegli(data.negli);
  }
  if (data.trick != null) {
    this.setupTable(data.trick);
    if (this.state == 'endtrick') {
      var card = this.table.players[data.current];
      card && card.setFrame('#FF0000');
    }
  }
  if (data.current != null) {
    this.setCurrentPlayer(data.current);
  }
  if (data.tricks != null) {
    this.updateTrickCount(data.tricks);
  }
};
