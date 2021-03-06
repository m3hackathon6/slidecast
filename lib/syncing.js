var presentations = require('./presentations');
var debug = require('debug')('slidecast');

module.exports = SyncingService;

/**
 * 各プレゼンテーションの現在のViewer数。
 * キー＝presId
 */
var viewerCounts = {};

/**
 * 各プレゼンテーションの現在表示中のスライド番号（０＝first slide）。
 * キー＝presId
 */
var currentSlideNumbers = {};

function presId2roomId(presId) {
  return 'presentation:' + presId;
}

/*
 * Constructor
 *
 * @param Socket.IO instance
 */
function SyncingService(io) {
  if (!(this instanceof SyncingService)) return new SyncingService(io, presentations);

  io.on('connection', function(socket) {

    socket.on('JoinAsPresenter', function(data) {
      debug('Received JoinAsPresenter event. Data:', data);
      if (!data.presId || !data.presenterKey) {
        socket.emit('ErrorMessage', 'Invalid request. You must supply a presentation ID and a presenter key in order to start a presentation.');
      } else {
        presentations
          .findById(data.presId)
          .then(function(presentation) {
            if (!presentation) {
              socket.emit('ErrorMessage', 'Could not find a presentation with ID ' + data.presId);
            } else {
              if (presentation.presenterKey != data.presenterKey) {
                socket.emit('ErrorMessage', 'Invalid presenter key');
              } else {
                // This is a valid presenter for this presentation
                socket.isPresenter = true;
                socket.presId = data.presId;
                socket.join(presId2roomId(data.presId));
                socket.emit('InfoMessage', 'Successfully authenticated presenter');
              }
            }
          });
      }
    });

    socket.on('JoinAsViewer', function(data) {
      debug('Received JoinAsViewer event. Data:', data);
      if (!data.presId) {
        socket.emit('ErrorMessage', 'Invalid request. You must supply a presentation ID in order to view a presentation.');
      } else {
        presentations
          .findById(data.presId)
          .then(function(presentation) {
            if (!presentation) {
              socket.emit('ErrorMessage', 'Could not find a presentation with ID ' + data.presId);
            } else {
              socket.presId = data.presId;
              var newViewerCount = (viewerCounts[socket.presId] || 0) + 1;
              viewerCounts[socket.presId] = newViewerCount;
              var roomId = presId2roomId(data.presId);
              socket.join(roomId);

              // send viewer count message to both the new viewer and everybody else
              socket.emit('ViewerCountChanged', newViewerCount);
              socket.to(roomId).emit('ViewerCountChanged', newViewerCount);

              // tell the new viewer to go the current slide
              var currentSlide = currentSlideNumbers[socket.presId] || 0;
              socket.emit('ChangeSlide', { slide: currentSlide })
            }
          });
      }
    });

    socket.on('ChangeSlide', function(data) {
      debug('Received ChangeSlide event. Data:', data);
      if (!socket.isPresenter) {
        socket.emit('ErrorMessage', 'Only the presenter can change the slide!')
      } else {
        debug('Changing slide for presentation ' + socket.presId + '. slide=' + data.slide);

        // save the current slide number, in order to send it to latecomers
        currentSlideNumbers[socket.presId] = data.slide;

        // Forward the slide change to all clients
        socket.to(presId2roomId(socket.presId)).emit('ChangeSlide', data);
      }
    });

    socket.on('Comment', function(data) {
      debug('Received Comment event. Data:', data);
      // Forward the slide change to all clients
      socket.to(presId2roomId(socket.presId)).emit('Comment', data);
      // and back to the sender
      socket.emit('Comment', data);
    });

    socket.on('disconnect', function(data) {
      debug('Received disconnect. Socket ID:', socket.id);
      if (socket.presId) {
        var newViewerCount = Math.max(0, (viewerCounts[socket.presId] || 0) - 1);
        if (newViewerCount > 0) {
          viewerCounts[socket.presId] = newViewerCount;
        } else {
          // to avoid memory leaks, delete all state for this presentation when viewer count reaches zero
          delete viewerCounts[socket.presId];
          delete currentSlideNumbers[socket.presId];
        }
        var roomId = presId2roomId(socket.presId);
        socket.to(roomId).emit('ViewerCountChanged', newViewerCount);
      }
    });
  });

}
