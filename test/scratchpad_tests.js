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
      scratchpad.on("change", function(data) {
        expect(data).to.equal("abc");
        done();
      });

      scratchpad.apply(["si", [], ["abc", 0]]);
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
