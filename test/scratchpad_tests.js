describe("Scratchpad", function() {
  describe("constructor", function() {
    it("should have a data property", function() {
      var scratchpad = new Scratchpad();
      expect(scratchpad.data).to.not.equal(undefined);
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
  });
});
