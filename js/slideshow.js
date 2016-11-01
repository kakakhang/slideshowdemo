(function($) {
    
     // add the plugin to the jQuery.fn object
    $.fn.khangSlideShow = khangSlideShow;
    // support mobile swipe event
    $.fn.swipeDetect = swipeDetect;

    function slideShow(element, options) {
        // plugin's default options
        var defaults = {
            height : '250px',
            prevBtnText : '<',
            nextBtnText : '>',
            indicatorText: 'o',
            onChangeSlide: function(previousIndex, currentIndex) {}
        }
        var plugin = this;
        
        plugin.settings = {}
        
        var $element = $(element),
             element = element,
             watchCallbacks = {};
        
        // public methods
        plugin.addSlideshowItem = addSlideshowItem;
        
        init();
        //public methods
        function addSlideshowItem(img) {
            addImage(img);
            addNewIndicatorItem(plugin.size);
            set('currentIndex',plugin.size);
            plugin.size++;
        }
    
        //private methods 
        function init(){
            plugin.settings = $.extend({}, defaults, options);
            plugin.size = $element.find('img').size();
            createNavigateButtons();
            createIndicatorItems();
            bindEventToElements();
            setStyleForElements();
            set('currentIndex',0);
        }
        
        function setIndexIndicatorPosition() { 
            var slideshowWidth = $element.width();
            var $indicatorElement = $element.find(".index-indicator");
            var indicatorWidth = $indicatorElement.width();
            var indicatorLeft = ( slideshowWidth - indicatorWidth ) / 2 ;
            $indicatorElement.css({left: indicatorLeft + 'px'});
        }
        
        function setNavigationButtonPosition() {
            var slideshowHeight = $element.height();
            var $btnNavigation = $element.find('.btn-nav');
            var btnTop = (slideshowHeight - $btnNavigation.height()) / 2;
            $btnNavigation.css({top:  btnTop + 'px'}); 
        }
        
        function setStyleForElements() {
            $element.addClass('slideshow');
            $element.height(plugin.settings.height);
            $element.find('img').height(plugin.settings.height);
            setIndexIndicatorPosition();
            setNavigationButtonPosition();
        }
        
        function createNavigateButtons() {
            $element.append('<div class="btn-nav btn-prev"> '+ plugin.settings.prevBtnText + '</div>');
            $element.append('<div class="btn-nav btn-next"> '+ plugin.settings.nextBtnText + '</div>');
        }
        
        function createIndicatorItems() {
            var items = '';
            for(var i = 0; i < plugin.size; i++) {
                items += '<li><a data-index="' + i + '" href="javascript:void(0)"> '+ plugin.settings.indicatorText+'</a></li>';
            }
            $element.append('<div class="test"><ul class="index-indicator">'+ items +'</ul></div>');
        }
        
        function bindEventToElements() {
            var btnPrev =  $element.find('.btn-prev');
            var btnNext =  $element.find('.btn-next');
            var indicatorItems =  $element.find('.index-indicator a');
            var images = $element.find('img').swipeDetect();
            //Register event for prev/next button
            btnPrev.click(onBtnPrevClickHandler);
            btnNext.click(onBtnNextClickHandler);
            
            //Register event for indicator items
            indicatorItems.click(onIndicatorItemClickHandler);
            
            //Register swipe event for images
            images.on('swipeleft',onBtnNextClickHandler);
            images.on('swiperight',onBtnPrevClickHandler);

            $( window ).resize(setIndexIndicatorPosition);
            //Detect change current image
            watch('currentIndex', function(prevIndex, newIndex){
                setActiveImage(newIndex);
                if(plugin.settings.onChangeSlide) {
                    plugin.settings.onChangeSlide(prevIndex, newIndex);
                }
            });
        }
        
        function onBtnPrevClickHandler(e) {
            var lastIndex = plugin.size - 1;
            var nextIndex = plugin.currentIndex == 0 ? lastIndex : plugin.currentIndex - 1;
            set('currentIndex', nextIndex);
        }
        
        function onBtnNextClickHandler(e) {
            var lastIndex = plugin.size - 1;
            var nextIndex = plugin.currentIndex == lastIndex ? 0 : plugin.currentIndex + 1;
            set('currentIndex', nextIndex);
        }
        
        function onIndicatorItemClickHandler(e) {
            var clickedItemIndex = parseInt($(e.target).attr('data-index'));
            set('currentIndex', clickedItemIndex);
        }
        
        function setActiveImage(index) {
            $element.find('img').not(':eq('+ index +')').fadeOut();
            $element.find('img:eq('+ index +')').fadeIn();
            //Set current indicator index
            $element.find('.index-indicator a').removeClass('active');
            $element.find('.index-indicator a:eq('+index+')').addClass('active');
        }
        
        function addNewIndicatorItem(index) {
            var newIndicator = $('<li><a data-index="' + index + '" href="javascript:void(0)"> '+ plugin.settings.indicatorText + '</a></li>');
            newIndicator.click(onIndicatorItemClickHandler);
            $element.find('.index-indicator').append(newIndicator);
        }
                
        function addImage(img) {
            var $img = $(img);
            $img.height(plugin.settings.height);
            $img.swipeDetect()
                .on('swipeleft',onBtnNextClickHandler)
                .on('swiperight',onBtnPrevClickHandler);
            $element.append($img);
        }
        
        function set(prop, val){
            if( plugin[prop] != val) {
                if( watchCallbacks[prop] ) {
                    for(var x = 0; x < watchCallbacks[prop].length ; x++) {
                         watchCallbacks[prop][x](plugin[prop], val);
                    }
                }
            }
            plugin[prop] = val;
        }

        function watch(prop, callback) {
            if(watchCallbacks[prop]) {
                watchCallbacks[prop].push(callback);
            } else {
                watchCallbacks[prop] = [callback];
            }
        }
    }

    function khangSlideShow(options) {
         return this.each(function() {
            if (undefined == $(this).data('khangSlideShow')) {
                var plugin = new slideShow(this, options);
                $(this).data('khangSlideShow', plugin);
            }
        });
    }
     
    function swipeDetect(){
        var swipedir,
            startX,
            startY,
            distX,
            distY,
            threshold = 150, //required min distance traveled to be considered swipe
            restraint = 100, // maximum distance allowed at the same time in perpendicular direction
            allowedTime = 300, // maximum time allowed to travel that distance
            elapsedTime,
            startTime;
        return this.each(function(){
            if(this.addEventListener) { 
                this.addEventListener('touchstart',onTouchStart , false);
                this.addEventListener('touchmove', onTouchMove, false);
                this.addEventListener('touchend',onTouchEnd, false);
            }
        });
        
        function onTouchStart(e){
            var touchobj = e.changedTouches[0];
            swipedir = 'none';
            dist = 0;
            startX = touchobj.pageX;
            startY = touchobj.pageY;
            startTime = new Date().getTime(); // record time when finger first makes contact with surface
            e.preventDefault();
        }
        function onTouchMove(e){
            e.preventDefault();
        }
        function onTouchEnd(e){
            var touchobj = e.changedTouches[0];
            distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
            distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
            elapsedTime = new Date().getTime() - startTime; // get time elapsed
            if (elapsedTime <= allowedTime){ // first condition for awipe met
                if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint){ // 2nd condition for horizontal swipe met
                    swipedir = (distX < 0)? 'left' : 'right'; // if dist traveled is negative, it indicates left swipe
                }
                else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint){ // 2nd condition for vertical swipe met
                    swipedir = (distY < 0)? 'up' : 'down'; // if dist traveled is negative, it indicates up swipe
                }
            }
            $(e.target).trigger('swipe' + swipedir);
            e.preventDefault();
        }
    }
    
})(jQuery);
