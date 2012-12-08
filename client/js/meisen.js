function Meisen() {
  this.canvas = null;
  this.paper = null;
  this.state = null;
}
Meisen.prototype.init = function() {
  this.canvas = $('#canvas');
  var width = this.canvas.width(), height = this.canvas.height();
  this.paper = new ScaleRaphael('canvas', 480, 360);
  $(window).resize(_.bind(this.onResize, this));
  this.onResize();
  this.test();
};
Meisen.prototype.onResize = function() {
  var width = this.canvas.width(), height = this.canvas.height();
  this.paper.changeSize(width, height, true, true);
};
Meisen.prototype.test = function() {
  var el = this.paper.rect(0, 0, 48, 48);
  el.attr({fill: "#fff"});
  el.click(function(){
    this.animate(Raphael.animation(
      { x: this.attr("x")+12, y: this.attr("y")+4 },
      100));
  });
  el = this.paper.rect(480-48, 360-48, 48, 48);
  el.attr({fill: "#fff"});
};
