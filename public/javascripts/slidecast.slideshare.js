(function() {
  var socket = window.io();

  socket.on('InfoMessage', function(data) { console.log('Info:', data) });
  socket.on('ErrorMessage', function(data) { console.log('Error:', data) });
  socket.on('ViewerCountChanged', function(viewerCount) { console.log('Viewer count changed, there are now ' + viewerCount + ' viewers') });

  // The <a> tag that holds all data injected server-side
  var dataTag = $('#slidecast-data');

  if (dataTag.data('presenter')) {
    socket.emit('JoinAsPresenter', { presId: dataTag.data('pres-id'), presenterKey: dataTag.data('presenter-key') });

    var notify = function(slideIndex) {
      var data = {
        indexh : slideIndex,
        indexv : 0,
        indexf : 0
      };

      console.log('Sending ChangeSlide event', data);
      socket.emit('ChangeSlide', data);
    }
  
    // SlideShare doesn't expose any listener APIs,
    // so just poll for the current slide index every 100ms
    // and send a message if it has changed.
    
    var lastKnownPosition = 1; // slides start at 1, not 0
    setInterval(function() {
      var currentPosition = $.slideshareEventManager.controller.currentPosition;
      if (currentPosition != lastKnownPosition) {
        // slide has changed
        notify(currentPosition);
        lastKnownPosition = currentPosition;
      }
    }, 100);
  } else {
    socket.emit('JoinAsViewer', { presId: dataTag.data('pres-id') });
    socket.on('ChangeSlide', function(data) {
      var index = data.indexh;
      var force = false;
      var source = "";
      $.slideshareEventManager.controller.play(index, force, source);
    });
  }
})();
