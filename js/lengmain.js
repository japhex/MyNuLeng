$(document).ready(function(){
    // Pageload call to functions to load straight away
    leng.backgroundChange();
    leng.scrollToSection();
});

// Global leng object to contain functions
var leng = {
    backgroundChange: function(){
        var header = $('body'),
            backgrounds = ['url(images/lengover2.1.jpg)', 'url(images/lengcontact.jpg)',],
            current = 0;

        function nextBackground() {
            current++;
            current = current % backgrounds.length;
            header.css('background-image', backgrounds[current]);
        }
        setInterval(nextBackground, 60000);

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
