(function() {
  
  var slidecast = window.slidecast || {};

  // Note: In Slidecast we say that slide index starts at 0,
  // but the Slideshare embed code starts its indexing at 1
  slidecast.getCurrentSlideIndex = function() {
    return $.slideshareEventManager.controller.currentPosition - 1;
  }

  slidecast.goToSlide = function(index) {
    var force = false;
    var source = "";
    $.slideshareEventManager.controller.play(index + 1, force, source);
  }

  window.slidecast = slidecast;

})();
