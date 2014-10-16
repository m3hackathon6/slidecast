(function() {
  var $window = $(window);
  var $body = $('body');
  var $scratchpad = $('#slidecast-scratchpad');
  var $commentsForm = $('#slidecast-form');
  var $commentBox = $('#slidecast-comment');

  // Comments to be displayed.
  // Each element is a jQuery-ified <div> element
  var comments = [];

  var socket = window.io();

  socket.on('InfoMessage', function(data) { console.log('Info:', data) });
  socket.on('ErrorMessage', function(data) { console.log('Error:', data) });
  socket.on('ViewerCountChanged', function(viewerCount) { console.log('Viewer count changed, there are now ' + viewerCount + ' viewers') });

  // event loop to update comment positions every 100 ms
  setInterval(function() {
    for (var i = comments.length - 1; i >= 0; i--) {
      var $elem = comments[i];
      var currentOffset = $elem.offset();
      if (currentOffset.left + $elem.width() < 0) {
        // If element has left the screen, remove from array and DOM
        comments.splice(i, 1);
        $elem.remove();
      } else {
        // otherwise, shift it to the left
        $elem.offset({top: currentOffset.top, left: currentOffset.left - 10});
      }
    }
  }, 100);

  // Sending a comment
  $commentsForm.submit(function(e) {
    e.preventDefault();
    var comment = $commentBox.val();
    if (comment && comment != '') {
      // Send comment to server
      socket.emit('Comment', comment);

      // clear the comment box
      $commentBox.val("");
    }
  });

  // Receiving a comment
  socket.on('Comment', function(data) {
    // Display the comment at a random place
    var x = Math.random() * $window.height();

    // Create a DOM element for the comment
    var $elem = $('<div style="position: absolute; top: ' + x + 'px; font-size: 200%; white-space:nowrap;">' + data + '</div>');

    // Add it to the scratchpad so we can measure its width
    $scratchpad.append($elem);

    // Start with the comment's end at the right hand side of screen
    var startingY = $window.width() - $elem.width();
    $elem.remove(); // remove from scratchpad
    $elem.css('left', startingY);

    // Add it to the array so it can be moved later
    comments.push($elem);

    // Add it to the DOM
    $body.append($elem);
  });

  // The <a> tag that holds all data injected server-side
  var $dataTag = $('#slidecast-data');

  if ($dataTag.data('presenter')) {
    socket.emit('JoinAsPresenter', { presId: $dataTag.data('pres-id'), presenterKey: $dataTag.data('presenter-key') });

    var notify = function(slideIndex) {
      var data = {
        slide : slideIndex
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
    socket.emit('JoinAsViewer', { presId: $dataTag.data('pres-id') });
    socket.on('ChangeSlide', function(data) {
      var index = data.slide;
      var force = false;
      var source = "";
      $.slideshareEventManager.controller.play(index, force, source);
    });
  }
})();
