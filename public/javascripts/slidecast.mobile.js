(function() {
  
  var slidecast = window.slidecast || {};

  // Note: In Slidecast we say that slide index starts at 0,
  // and the Slideshare mobile code agrees with us
  slidecast.getCurrentSlideIndex = function() {
    return window.mobilePlayer.index;
  }

  slidecast.goToSlide = function(index) {
    mobilePlayer.showSlide(index);
  }

  window.slidecast = slidecast;

})();
