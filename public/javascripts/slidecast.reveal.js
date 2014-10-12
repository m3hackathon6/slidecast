// このファイルをreveal.jsの<head>内に差し込むことによって
// スライドの遷移をWebSocketで同期できるようになる。
//
// TODO Viewerの場合、（ロック状態によっては）スライド遷移を禁止するためにイベントを遮る。keyboard, mouse, tap, swipeとか、いちいち列挙して対応する必要があるので、意外と面倒くさいかも。

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

  var queryHash = Reveal.getQueryHash();
  if (queryHash.presenter) {
    socket.emit('JoinAsPresenter', { presId: '123', presenterKey: '8760228e-7b6a-49e1-bbce-f6db2b318195' });

    var notify = function(slideElement, indexh, indexv) {
      var fragmentIndex = Reveal.getIndices().f;
      if (typeof fragmentIndex === 'undefined') {
        fragmentIndex = 0;
      }

      var data = {
        indexh : indexh,
        indexv : indexv,
        indexf : fragmentIndex
      };

      console.log('Sending ChangeSlide event', data);
      socket.emit('ChangeSlide', data);
    }

    Reveal.addEventListener('slidechanged', function(event) {
      notify(event.currentSlide, event.indexh, event.indexv);
    });

    var fragmentNotify = function(event) {
      notify(Reveal.getCurrentSlide(), Reveal.getIndices().h, Reveal.getIndices().v);
    };

    Reveal.addEventListener('fragmentshown', fragmentNotify);
    Reveal.addEventListener('fragmenthidden', fragmentNotify);
  } else {
    socket.emit('JoinAsViewer', { presId: '123' });
    socket.on('ChangeSlide', function(data) {
      Reveal.slide(data.indexh, data.indexv, data.indexf);
    });
  }
})();
