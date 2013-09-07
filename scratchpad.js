var Queue = (function() {
  function Queue(size) {
    this.size = size;
    this.items = [];
    this.version = 0;
  }

  Queue.prototype.push = function(item) {
    this.items.push([this.version, item]);
    this.version += 1;

    if (this.items.length > this.size)
      this.items.shift();
  };

  Queue.prototype.toTrQueue = function(trackid) {
    var trQueue = [];
    var include = false;
    this.items.forEach(function(item) {
      var version = item[0];
      var op = item[1];

      if (version === trackid)
        include = true;

      if (include)
        trQueue.push(op);
    });

    return trQueue;
  };

  return Queue;
}());

var Scratchpad = (function() {

  function Scratchpad() {
    this.data = "";
    this.queue = new Queue(10);
  }

  MicroEvent.mixin(Scratchpad);
  Scratchpad.prototype.on = Scratchpad.prototype.bind;
  Scratchpad.prototype.off = Scratchpad.prototype.unbind;
  Scratchpad.prototype.emit = Scratchpad.prototype.trigger;

  Scratchpad.prototype.apply = function(op, options) {
    if (options && options.transform)
      op = ot.transform(op, this.queue.toTrQueue(options.version));
    else
      this.queue.push(op);

    this.data = ot.apply(this.data, op);
    this.emit("change", this.data);
  };

  return Scratchpad;
}());
