(function() {
  var socket = window.io();

  socket.on('InfoMessage', function(data) { console.log('Info:', data) });
  socket.on('ErrorMessage', function(data) { console.log('Error:', data) });
  socket.on('ViewerCountChanged', function(viewerCount) { console.log('Viewer count changed, there are now ' + viewerCount + ' viewers') });

  /*
   * Note: obviously we wouldn't just let the user write ?presenter=true in the URL.
   * On server side we would inject some HTML into the presenter's copy of the file,
   * e.g. <a id="slidecast-data" data-presId="123" data-presenter="true" data-presenterKey="..." />
   * and the JS would read this and act accordingly.
   */

  if (window.location.search.indexOf('presenter') > -1) {
    socket.emit('JoinAsPresenter', { presId: '123', presenterKey: '8760228e-7b6a-49e1-bbce-f6db2b318195' });

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
    socket.emit('JoinAsViewer', { presId: '123' });
    socket.on('ChangeSlide', function(data) {
      var index = data.indexh;
      var force = false;
      var source = "";
      $.slideshareEventManager.controller.play(index, force, source);
    });
  }
})();
