/**
 * Create ZoomNav object
 * @param {Object} parameters - Parameters
 * @param {Element|String|jQuery} parameters.zoomContainer - Element, inside which all zoom is happening
 * @param {Array} [zoomContainerSize] - Container size
 * @param {Element|String|jQuery} parameters.zoomedImage Zoomed image to be scrolled
 * @param {Array} [zoomedImageSize] - Zoomed image size
 * @param {Number} [parameters.marginX=0] - Empty area in pixels at the left and the right of the zoomContainer
 * @param {Number} [parameters.marginY=0] - Empty area in pixels at the top and the bottom of the zoomContainer
 * @param {Number} [parameters.inverseAnimationSpeed=15] - Inverse animation speed (the lower the faster)
 * @param {Number} [parameters.animationAccuracy=8] - Animation accuracy in pixels (less means more accurate)
 * @param {Number} [parameters.zoomedImageDefaultX=0] - Image default X position
 * @param {Number} [parameters.zoomedImageDefaultY=0] - Image default Y position
 * @param {Boolean} [parameters.centerZoomedImage=true] - Center zoomed image when it's too small
 * @param {Object} [customAnimation] - Custom animation object
 * @param {String} [movementMethod='translate3d'] - Image movement method. Can be 'translate3d' or 'lefttop'
 */
function SuperAwesomeZoom(parameters) {
    if (typeof parameters.zoomContainer == "string") {
        this.zoomContainer = document.querySelector(parameters.zoomContainer);
    } else if (jQuery !== undefined && parameters.zoomContainer instanceof jQuery) {
        this.zoomContainer = parameters.zoomContainer.get(0);
    }
    else {
        this.zoomContainer = parameters.zoomContainer;
    }
    
    if (typeof parameters.zoomedImage == "string") {
        this.zoomedImage = document.querySelector(parameters.zoomedImage);
    } else if (jQuery !== undefined && parameters.zoomedImage instanceof jQuery) {
        this.zoomedImage = parameters.zoomedImage.get(0);
    }
    else {
        this.zoomedImage = parameters.zoomedImage;
    }
    
    this.movementMethod = parameters.movementMethod || 'translate3d';
    
    if (parameters.marginX !== undefined) {
        this.marginX = parameters.marginX;
    } else {
        this.marginX = 0;
    }
    
    if (parameters.marginY !== undefined) {
        this.marginY = parameters.marginY;
    } else {
        this.marginY = 0;
    }
    
    this.zoomedImageDefaultX = parameters.zoomedImageDefaultX || 0;
    this.zoomedImageDefaultY = parameters.zoomedImageDefaultY || 0;

    this.halfMarginX = this.marginX / 2;
    this.halfMarginY = this.marginY / 2;
    
    if (parameters.inverseAnimationSpeed !== undefined) {
        this.inverseAnimationSpeed = parameters.inverseAnimationSpeed;
    } else {
        this.inverseAnimationSpeed = 15;
    }

    if (parameters.animationAccuracy !== undefined) {
        this.animationAccuracy = parameters.animationAccuracy;
    } else {
        this.animationAccuracy = 3;
    }
    
    // Last mouse position
    this.lastX = 0;
    this.lastY = 0;
    
    if (parameters.centerZoomedImage !== undefined) {
        this.centerZoomedImage = parameters.centerZoomedImage;
    } else {
        this.centerZoomedImage = true;
    }
    
    var self = this;
    
    /**
     * Calculate image position
     * @param {Number} x X coordinate
     * @param {Number} y Y coordinate
     * @returns {Array}
     */
    this.calculateImagePosition = function(x, y) {
        if (self.ratioX == 0) {
            if (self.centerZoomedImage) {
                var dx = self.zoomContainerWidth / 2 - (self.zoomedImageWidth - self.marginX)/ 2;
            } else {
                var dx = self.zoomedImageDefaultX;
            }
        } else {
            var dx = -x * self.ratioX + self.halfMarginX;
        }
        
        if (self.ratioY == 0) {
            if (self.centerZoomedImage) {
                var dy = self.zoomContainerHeight / 2 - (self.zoomedImageHeight - self.marginY) / 2;
            } else {
                var dy = self.zoomedImageDefaultY;
            }
        } else {
            var dy = -y * self.ratioY + self.halfMarginY;
        }
        
        return [dx, dy];
    };
    
    if (parameters.customAnimation !== undefined) {
        this.animation = new parameters.customAnimation({element: this.zoomedImage,
                                                         inverseAnimationSpeed: this.inverseAnimationSpeed,
                                                         animationAccuracy: this.animationAccuracy,
                                                         movementMethod: this.movementMethod});
    } else {
        this.animation = new MovementAnimation({element: this.zoomedImage,
                                                inverseAnimationSpeed: this.inverseAnimationSpeed,
                                                animationAccuracy: this.animationAccuracy,
                                                movementMethod: this.movementMethod});
    }
    
    /**
     * Recalculates dimensions
     */
    this.recalculate = function() {
        self.zoomedImageWidth = self.zoomedImage.offsetWidth + self.marginX;
        self.zoomedImageHeight = self.zoomedImage.offsetHeight + self.marginY;
        self.zoomContainerWidth = self.zoomContainer.offsetWidth;
        self.zoomContainerHeight = self.zoomContainer.offsetHeight;
        self.ratioX = Math.max((self.zoomedImageWidth - self.zoomContainerWidth) / self.zoomContainerWidth, 0);
        self.ratioY = Math.max((self.zoomedImageHeight - self.zoomContainerHeight) / self.zoomContainerHeight, 0);
    };
    
    this.resizeHandler = function(event) {
        self.recalculate();
        var newImagePosition = self.calculateImagePosition(self.lastX, self.lastY);
        self.animation.setTargetPoints(newImagePosition[0], newImagePosition[1]);
    };
    
    /**
     * Adds resize event handler
     */
    this.addResizeHandler = function() {
        self.zoomContainer.addEventListener('resize', self.resizeHandler);
        window.addEventListener('resize', self.resizeHandler);
    }; 
    
    this.clickHandler = function(event) {
        // Show zoomed image
        self.zoomContainer.style.display = 'block';
        
        // Make page unscrollable
        document.querySelector('html').style.overflow = 'hidden';
        
        self.lastX = event.clientX;
        self.lastY = event.clientY;
        
        self.recalculate();
        
        // Calculate new image position
        var newImagePosition = self.calculateImagePosition(event.clientX, event.clientY);
        var newImageX = newImagePosition[0];
        var newImageY = newImagePosition[1];
        
        // Set current image coordinates in animation
        self.animation.x = newImageX;
        self.animation.y = newImageY;
        self.animation.tx = newImageX;
        self.animation.ty = newImageY;
        
        // Move image
        moveElement(self.zoomedImage, newImageX, newImageY, self.movementMethod);
    };
    
    /**
     * Add click handler
     * @param {Element|String|jQuery} element
     */
    this.addClickHandler = function(element) {
        if (typeof element == "string") {
            var element = document.querySelector(element);
        } else if (jQuery !== undefined && element instanceof jQuery) {
            var element = element.get(0);
        }
        
        element.addEventListener('click', self.clickHandler);
    };
    
    this.zoomContainerClickHandler = function(event) {
        self.zoomContainer.style.display = '';
        document.querySelector('html').style.overflow = '';
    };
    
    this.addZoomContainerClickHandler = function() {
        self.zoomContainer.addEventListener('click', self.zoomContainerClickHandler);
    }
    
    this.mousemoveHandler = function(event) {
        // Don't do anything if mouse position change is not signifficant
        if (Math.abs(event.clientX - self.lastX) + Math.abs(event.clientY - self.lastY) < 15) {
            return;
        }
        
        self.lastX = event.clientX;
        self.lastY = event.clientY;
        
        var newImagePosition = self.calculateImagePosition(event.clientX, event.clientY);
        
        self.animation.setTargetPoints(newImagePosition[0], newImagePosition[1]);
    };
    
    this.addMousemoveHandler = function() {
        this.zoomContainer.addEventListener('mousemove', self.mousemoveHandler);
    };
    
    this.addMousemoveHandler();
    this.addResizeHandler();
    this.addZoomContainerClickHandler();
}

/**
 * Creates a MovementAnimation object
 * @param {Object} parameters - Parameters
 * @param {Element} parameter.element - Element to be animated
 * @param {Number} [parameter.start=null] - Animation start time
 * @param {Number} [parameter.x=0] - Current X coordinate
 * @param {Number} [parameter.y=0] - Current Y coordinate
 * @param {Number} [parameter.tx=0] - Target X coordinate
 * @param {Number} [parameter.ty=0] - Target Y coordinate
 * @param {Boolean} [parameter.running=false] - Flag to determine if animation is running
 * @param {Number} [parameter.animationAccuracy=5] - Animation accuracy (the smaller the more accurate)
 * @param {Number} [parameter.inverseAnimationSpeed=15] - Inverse animation speed (the smaller the faster)
 * @param {String} [movementMethod='translate3d'] - Image movement method. Can be 'translate3d' or 'lefttop'
 */
function MovementAnimation(parameters) {
    if (parameters.start !== undefined) {
        this.start = parameters.start;
    } else {
        this.start = null;
    }
    
    this.movementMethod = parameters.movementMethod || 'translate3d';
    
    this.x = parameters.x || 0;
    this.y = parameters.y || 0;
    this.tx = parameters.tx || 0;
    this.ty = parameters.ty || 0;
    this.running = parameters.running || false;
    
    if (parameters.animationAccuracy !== undefined) {
        this.animationAccuracy = parameters.animationAccuracy;
    } else {
        this.animationAccuracy = 5;
    }
    
    if (parameters.inverseAnimationSpeed !== undefined) {
        this.inverseAnimationSpeed = parameters.inverseAnimationSpeed;
    } else {
        this.inverseAnimationSpeed = 15;
    }
    
    this.element = parameters.element;
    
    var self = this;
    
    this.stop = function() {
        self.start = null;
        self.running = false;
    };
    
    this.reset = function() {
        self.stop();
        self.x = 0;
        self.y = 0;
        self.tx = 0;
        self.ty = 0;
    };
    
    /**
     * This function is used to determine whether to stop animation or not. true means yes.
     * @returns {Boolean}
    */
    this.check = function(obj) {
        // Stop animation if current image coordinates are close enough to target coordinates
        if (Math.abs(obj.x - obj.tx) < obj.animationAccuracy && Math.abs(obj.y - obj.ty) < obj.animationAccuracy) {
             obj.stop();
             return true;
        }
        
        return false;
    };
    
    this.updateElement = function(obj) {
        moveElement(obj.element, obj.x, obj.y, self.movementMethod);
    }
    
    this.step = function(obj) {
        obj.x += (obj.tx - obj.x) / obj.inverseAnimationSpeed;
        obj.y += (obj.ty - obj.y) / obj.inverseAnimationSpeed;
    };
    
    /**
     * Animation function for using with window.requestAnimationFrame
     * @param {Number} timestamp
     */
    this.animate = function(timestamp) {
        if (!self.start) self.start = timestamp;
        
        self.step(self);
        
        self.updateElement(self);
        
        self.check(self);
        
        if (!self.running) {
            return;
        }
      
        window.requestAnimationFrame(self.animate);
    };
    
    /**
     * Sets target points for animation
     * @param {Number} x X coordinate
     * @param {Number} y Y coordinate
     */
    this.setTargetPoints = function(x, y) {
        // Set target points
        self.tx = x;
        self.ty = y;
    
        // Start animation if it's not running
        if (!self.running) {
            self.running = true;
            window.requestAnimationFrame(self.animate);
        }
    };
}

/**
 * Moves element using transform: translate3d(x, y, 0)
 * @param {Element} element Element to be moved
 * @param {Number} x Target X coordinate
 * @param {Number} y Target Y coordinate
 */
function translateElement(element, x, y) {
    var s = 'translate3d(' + x + 'px,' + y + 'px,0px)';
    var regex = /translate3d\(.*?\)/g;
    if (element.style.transform.search(regex) == -1) {
        element.style.transform += ' ' + s;
    } else {
        element.style.transform = element.style.transform.replace(regex, s);
    }
}

/**
 * Moves element by using left and top
 * @param {Element} element Element to be moved
 * @param {Number} x Target X coordinate
 * @param {Number} y Target Y coordinate
 */
function setElementLeftTop(element, x, y) {
    element.style.left = x + 'px';
    element.style.top = y + 'px';
}

function moveElement(element, x, y, method) {
    if (method == 'translate3d') {
        translateElement(element, x, y);
    } else if (method == 'lefttop') {
        setElementLeftTop(element, x, y);
    }
}
