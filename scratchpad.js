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
    this.emit("change", this.data, op, !!(options && options.local));
  };

  // Based on https://github.com/share/ShareJS/blob/master/lib/client/textarea.js
  Scratchpad.prototype.computeOp = function(oldval, newval) {
    if (oldval === newval) return;

    var commonStart = 0;
    while (oldval.charAt(commonStart) === newval.charAt(commonStart)) {
      commonStart++;
    }

    var commonEnd = 0;
    while (oldval.charAt(oldval.length - 1 - commonEnd) === newval.charAt(newval.length - 1 - commonEnd) &&
           commonEnd + commonStart < oldval.length && commonEnd + commonStart < newval.length) {
      commonEnd++;
    }

    if (oldval.length !== commonStart + commonEnd) {
      var deletion = oldval.slice(commonStart, oldval.length - commonEnd);
      return ["sd", [], [deletion, commonStart]];
    }

    if (newval.length !== commonStart + commonEnd) {
      var insertion = newval.slice(commonStart, newval.length - commonEnd);
      return ["si", [], [insertion, commonStart]];
    }
  };

  return Scratchpad;
}());

var ScratchArea = (function() {
  function ScratchArea(properties) {
    this.node = properties.node;
    this.transport = properties.transport;
    this.scratchpad = new Scratchpad();
    this._monitoring = undefined;

    this.transport.onmessage = this._onMessage.bind(this);
    this.scratchpad.on("change", this._onChange.bind(this));

    if (properties.localstorage)
      this.scratchpad.on("change",
                         this._store.bind(this, properties.localstorage));
  };

  ScratchArea.prototype.monitor = function(interval) {
    this.monitoring = setInterval(function() {
      var scratchpad = this.scratchpad;
      var node = this.node;

      var op = scratchpad.computeOp(scratchpad.data, node.value);
      if (op)
        scratchpad.apply(op, {local: true});
    }.bind(this), interval);

    return this;
  };

  ScratchArea.prototype.stop = function() {
    clearInterval(this.monitoring);
    return this;
  };

  ScratchArea.prototype._onMessage = function(event) {
    var data = JSON.parse(event.data);
    this.scratchpad.apply(data.op);
  };

  ScratchArea.prototype._onChange = function(data, op, local) {
    if (local)
      return this.transport.send(JSON.stringify({op: op}));

    var cursor = this.node.selectionStart;
    this.node.value = data;

    if (op[0] === "si" && op[2][1] < cursor)
      cursor = cursor += op[2][0].length;
    if (op[0] === "sd" && op[2][1] < cursor)
      cursor = cursor -= op[2][0].length;

    this.node.selectionStart = this.node.selectionEnd = cursor;
  };

  ScratchArea.prototype._store = function(id, data) {
    localStorage.setItem(id, data);
  };

  return ScratchArea;
}());

