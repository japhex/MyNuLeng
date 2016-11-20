scrollTopPosition: function(){
    $(window).scroll(function() {
        var scrolledY = $(window).scrollTop();
        $('#container').css('background-position', 'left ' + ((scrolledY)) + 'px');
    });
},
