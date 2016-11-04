$(document).ready(function(){
    // Pageload call to functions to load straight away
    leng.scrollTopPosition();
    leng.backgroundChange();
    leng.scrollToSection();
});

// Global leng object to contain functions
var leng = {
    scrollTopPosition: function(){
        $(window).scroll(function() {
            var scrolledY = $(window).scrollTop();
            $('#container').css('background-position', 'left ' + ((scrolledY)) + 'px');
        });
    },
    backgroundChange: function(){
        var header = $('body'),
            backgrounds = ['url(images/lengover2.1.jpg)', 'url(images/lengcontact.jpg)', 'url(images/lengcover4.jpg)'],
            current = 0;

        function nextBackground() {
            current++;
            current = current % backgrounds.length;
            header.css('background-image', backgrounds[current]);
        }
        setInterval(nextBackground, 15000);

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
