$(document).ready(function(){
    // Pageload call to functions to load straight away
    leng.scrollTopPosition();
    leng.backgroundChange();
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
            backgrounds = ['url(lengover2.1.jpg)', 'url(lengcontact.jpg)', 'url(lengcover4.jpg)'],
            current = 0;

        function nextBackground() {
            current++;
            current = current % backgrounds.length;
            header.css('background-image', backgrounds[current]);
        }
        setInterval(nextBackground, 15000);

        header.css('background-image', backgrounds[0]);
    }
};
