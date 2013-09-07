var Scratchpad = (function() {

  function Scratchpad() {
    this.data = "";
  }

  MicroEvent.mixin(Scratchpad);
  Scratchpad.prototype.on = Scratchpad.prototype.bind;
  Scratchpad.prototype.off = Scratchpad.prototype.unbind;
  Scratchpad.prototype.emit = Scratchpad.prototype.trigger;

  Scratchpad.prototype.apply = function(op, options) {
    this.data = ot.apply(this.data, op);
    this.emit("change", this.data);
  };

  return Scratchpad;
}());
