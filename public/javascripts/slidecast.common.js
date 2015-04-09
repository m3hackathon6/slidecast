(function() {
  var $window = $(window);
  var $body = $('body');
  var $scratchpad = $('#slidecast-scratchpad');
  var $commentsForm = $('#slidecast-form');
  var $commentBox = $('#slidecast-comment');
  var $showCommentsCheckbox = $('#slidecast-show-comments');

  // Comments to be displayed.
  // Each element is a jQuery-ified <div> element
  var comments = [];

  // Should comments be visible
  var showComments = true;

  // How many people are viewing the presentation right now.
  // This is updated on receipt of a 'ViewerCountChanged' message.
  var currentViewerCount = 0;

  var socket = window.io();

  socket.on('InfoMessage', function(data) { console.log('Info:', data) });
  socket.on('ErrorMessage', function(data) { console.log('Error:', data) });
  socket.on('ViewerCountChanged', function(newViewerCount) { 
    console.log('Viewer count changed, there are now ' + newViewerCount + ' viewers');
    $('#viewer_count').counter({
          initial: currentViewerCount,
          direction: (newViewerCount >= currentViewerCount) ? 'up' : 'down',
          interval: '1',
          format: '99',
          stop: newViewerCount});
    currentViewerCount = newViewerCount;
  });

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

  // Enter key to send comment
  $(function() {
    $commentBox.keypress(function (e) {
      if (e.which === 13) {
        $commentsForm.submit();
      }
    });

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

    // Toggle comment visibility
    $showCommentsCheckbox.change(function(e) {
      if($showCommentsCheckbox.prop("checked")) {
        showComments = true;
        $('.slidecast-comment').show();
      } else {
        showComments = false;
        $('.slidecast-comment').hide();
      }
    });
  });

  function randomColour() {
    function c() {
        return Math.floor(Math.random()*256).toString(16)
      }
    return "#"+c()+c()+c();
  }

  // Receiving a comment
  socket.on('Comment', function(data) {
    // Give it a random colour
    var colour = randomColour();

    // Create a DOM element for the comment
    var $elem = $('<div class="slidecast-comment" style="position: absolute; font-size: 300%; font-weight: bold; color: ' + colour + '; white-space:nowrap;"></div>');

    if (!showComments) {
      $elem.hide();
    }

    if (data === 'chris' || data === 'Chris' || data === 'クリス') {
      $elem.html('<img src="/images/chris.png"/>');
    } else {
      // use .text() to avoid XSS
      $elem.text(data);
    }

    // Add it to the scratchpad so we can measure its width and height
    $scratchpad.append($elem);

    // Display the comment at a random place, but make sure it's on the screen
    var x = Math.min(Math.random() * $window.height(), $window.height() - $elem.height());

    // Start with the comment's end at the right hand side of screen
    var startingY = $window.width() - $elem.width();

    $elem.remove(); // remove from scratchpad
    $elem.css('top', x);
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
    
    // By convention, we say that first slide is index 0, not 1
    var lastKnownPosition = 0;

    setInterval(function() {
      var currentPosition = window.slidecast.getCurrentSlideIndex();
      if (currentPosition != lastKnownPosition) {
        // slide has changed
        notify(currentPosition);
        lastKnownPosition = currentPosition;
      }
    }, 100);
  } else {
    socket.emit('JoinAsViewer', { presId: $dataTag.data('pres-id') });
    socket.on('ChangeSlide', function(data) {
      window.slidecast.goToSlide(data.slide);
    });
  }
})();
