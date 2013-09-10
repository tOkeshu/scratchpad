describe("Scratchpad", function() {

  describe("constructor", function() {
    it("should have a data property", function() {
      var scratchpad = new Scratchpad();
      expect(scratchpad.data).to.not.equal(undefined);
    });

    it("should have a queue property", function() {
      var scratchpad = new Scratchpad();
      expect(scratchpad.queue).to.a(Queue);
    });
  });

  describe("#apply", function() {
    it("should apply an op", function() {
      var scratchpad = new Scratchpad();
      scratchpad.data = "abc";

      scratchpad.apply(["si", [], ["def", 3]]);

      expect(scratchpad.data).to.equal("abcdef");
    });

    it("should emit an change event", function(done) {
      var scratchpad = new Scratchpad();
      scratchpad.on("change", function(data, op) {
        expect(data).to.equal("abc");
        expect(op).to.eql(["si", [], ["abc", 0]]);
        done();
      });

      scratchpad.apply(["si", [], ["abc", 0]]);
    });

    it("should say if the change is local or not", function(done) {
      var n = 1;
      var scratchpad = new Scratchpad();
      scratchpad.on("change", function(data, op, local) {
        if (n === 1)
          expect(local).to.equal(false);
        else if (n === 2) {
          expect(local).to.equal(true);
          done();
        }

        n += 1;
      });

      scratchpad.apply(["si", [], ["abc", 0]]);
      scratchpad.apply(["si", [], ["abc", 0]], {local: true});
    });

    it("should queue the op if not transformed", function() {
      var scratchpad = new Scratchpad();

      scratchpad.apply(["si", [], ["abc", 0]]);

      expect(scratchpad.queue.toTrQueue(0)).to.eql([["si", [], ["abc", 0]]]);
    });

    it("should transform the op if asked", function() {
      var scratchpad = new Scratchpad();

      scratchpad.apply(["si", [], ["abc", 0]]);
      scratchpad.apply(["si", [], ["def", 0]], {
        transform: true,
        version: 0
      });

      expect(scratchpad.data).to.equal("abcdef");
    });

  });

  describe("#computeOp", function() {

    it("should create a si op", function() {
      var scratchpad = new Scratchpad();
      var oldval = ""
      var newval = "foo";

      expect(scratchpad.computeOp(oldval, newval))
        .to.eql(["si", [], ["foo", 0]]);
    });

    it("should create a sd op", function() {
      var scratchpad = new Scratchpad();
      var oldval = "foo"
      var newval = "";

      expect(scratchpad.computeOp(oldval, newval))
        .to.eql(["sd", [], ["foo", 0]]);
    });

  });
});

describe("Queue", function() {

  describe("constructor", function() {

    it("should have a size property", function() {
      var queue = new Queue(10);
      expect(queue.size).to.equal(10);
    });

    it("should have an array of items", function() {
      var queue = new Queue(10);
      expect(queue.items).to.be.an(Array);
    });

    it("should have a version property", function() {
      var queue = new Queue(10);
      expect(queue.version).to.equal(0);
    });

  });

  describe("#push", function() {

    it("should add an item to the queue", function() {
      var queue = new Queue(10);
      queue.push("item1");
      queue.push("item2");
      expect(queue.items.length).to.equal(2);
    });

    it("should keep a fixed number of items", function() {
      var queue = new Queue(3);
      queue.push("item1");
      queue.push("item2");
      queue.push("item3");
      queue.push("item4");
      expect(queue.items.length).to.equal(3);
    });
  });

  describe("#toTrQueue", function() {

    it("should return an array of items", function() {
      var queue = new Queue(10);
      queue.push("item1");
      queue.push("item2");
      queue.push("item3");
      expect(queue.toTrQueue(0)).to.eql(["item1", "item2", "item3"]);
    });

    it("should return a filtered array of items", function() {
      var queue = new Queue(10);
      queue.push("item1");
      queue.push("item2");
      queue.push("item3");
      expect(queue.toTrQueue(2)).to.eql(["item3"]);
    });

  });
});

describe("ScratchArea", function() {

  describe("constructor", function() {

    it("should have a node and a transport property", function() {
      var node = document.querySelector("textarea");
      var transport = {};
      var scratcharea = new ScratchArea({
        node: node,
        transport: transport
      });
      expect(scratcharea.node).to.equal(node);
      expect(scratcharea.transport).to.equal(transport);
    });

    it("should have a scratchpad property", function() {
      var node = document.querySelector("textarea");
      var scratcharea = new ScratchArea({
        node: node,
        transport: {}
      });
      expect(scratcharea.scratchpad).to.be.a(Scratchpad);
    });

  });

  describe("incoming 'op' event", function() {

    it("should apply the op to the pad", function() {
      var dc = {}
      var textarea = document.querySelector("textarea");
      var scratcharea = new ScratchArea({
        node: textarea,
        transport: dc
      });
      var event = {data: JSON.stringify({op: ["si", [], ["abc", 0]], v: 0})}

      dc.onmessage(event);

      expect(textarea.value).to.equal("abc");
    });

    it("should move the cursor appropriately", function() {
      var dc = {}
      var textarea = document.querySelector("textarea");
      var scratcharea = new ScratchArea({
        node: textarea,
        transport: dc
      });
      var event = {data: JSON.stringify({op: ["si", [], ["abc", 0]], v: 0})}
      textarea.selectionStart = 7;

      dc.onmessage(event);

      expect(textarea.selectionStart).to.equal(10);
      expect(textarea.selectionEnd).to.equal(10);
    });

  });

  describe("outgoing 'op' event", function() {

    it("should be triggered if the textarea change", function(done) {
      var scratcharea, textarea, dc;
      dc = {send: function(data) {
        var data = JSON.parse(data);
        expect(data).to.eql({op: ["si", [], ["abc", 0]]});
        scratcharea.stop();
        done();
      }};
      textarea = document.querySelector("textarea");
      scratcharea = new ScratchArea({
        node: textarea,
        transport: dc
      }).monitor(10);

      textarea.value = "abc";
    });
  });

  describe("ScratchPad change", function() {

    it("should store the content in localStorage", function() {
      var textarea = document.querySelector("textarea");
      var scratcharea = new ScratchArea({
        node: textarea,
        transport: {send: function() {}},
        localstorage: "an id"
      });

      scratcharea.scratchpad.trigger("change", "abc", null, true);
      expect(localStorage.getItem("an id")).to.equal("abc");
    });

  });
});

