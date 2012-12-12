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
