$(document).ready(function(){
    // Pageload call to functions to load straight away
    leng.backgroundChange();
    leng.scrollToSection();
});

// Global leng object to contain functions
var leng = {
    backgroundChange: function(){
        var header = $('body'),
            backgrounds = new Array(
              'url(lengover2.1.jpg)'
            , 'url(lengcontact.jpg)'
          );
            current = 0;

        function nextBackground() {
            current++;
            current = current % backgrounds.length;
            header.css('background-image', backgrounds[current]);
        }
        setInterval(nextBackground, 120000);

        header.css('background-image', backgrounds[0]);
    },
    scrollToSection: function() {
        $('body').on('click', '[data-section]', function(){
            var sectionToFind = $(this).data('section');

            $('html, body').animate({
                scrollTop: $('.' + sectionToFind).offset().top
            }, 1000);
            return false;
        });
    }
};
      // Opacity DIV on Scroll
      var header = $('.tranny');
      var range = 150;

      $(window).on('scroll', function () {

      var scrollTop = $(this).scrollTop();
      var offset = header.offset().top;
      var height = header.outerHeight();
      offset = offset + height / 2;
      var calc = 0 + (scrollTop - offset + range) / range;

      header.css({ 'opacity': calc });

      if ( calc > '1' ) {
      header.css({ 'opacity': 1 });
      } else if ( calc < '0' ) {
      header.css({ 'opacity': 0 });
      }

      });

      // Video Play on Scroll
      $(document).ready(function() {
    // Get media - with autoplay disabled (audio or video)
    var media = $('video').not("[autoplay='autoplay']");
    var tolerancePixel = 40;

    function checkMedia(){
        // Get current browser top and bottom
        var scrollTop = $(window).scrollTop() + tolerancePixel;
        var scrollBottom = $(window).scrollTop() + $(window).height() - tolerancePixel;

        media.each(function(index, el) {
            var yTopMedia = $(this).offset().top;
            var yBottomMedia = $(this).height() + yTopMedia;

            if(scrollTop < yBottomMedia && scrollBottom > yTopMedia){ //view explaination in `In brief` section above
                $(this).get(0).play();
            } else {
                $(this).get(0).pause();
            }
        });

        //}
    }
    $(document).on('scroll', checkMedia);
});
