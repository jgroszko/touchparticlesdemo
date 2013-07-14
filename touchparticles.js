(function() {
    // requestAnim shim layer by Paul Irish
    window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
            };
    })();
    
    var MAX_PARTICLES = 20;
    var DISTANCE = 100;
    var REPULSION = 0.01;
    var ATTRACTION = 0.005;
    
    var OFFSCREEN_TOLERANCE = 100;

    var debugArea = document.getElementById("debug");
    var canvas = document.getElementById('myCanvas');
    var ctx = canvas.getContext("2d");
    var ongoingtouches = Array();
    var orientation = { alpha: 0.0, beta: 0.0, gamma: 0.0 };

    var gradient = ctx.createRadialGradient(75, 50, 5, 90, 60, 100);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.0)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 1.0)");
    

    var drawCircle = function(x, y) {
	ctx.beginPath();
	ctx.arc(x, y, 20, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.fillStyle = gradient;
	ctx.fill();
    };

    var drawTail = function(x, y, tail) {
	ctx.beginPath();
	ctx.moveTo(x, y);
	for(var i = tail.length-1; i >= 0; i--)
	{
	    ctx.lineTo(tail[i].x, tail[i].y);
	}
	ctx.strokeStyle = "blue";
	ctx.stroke();
    };

    var draw = function() {
	canvas.width = canvas.width;

	var orientationX = -0.5 * (orientation.gamma / 90);
	var orientationY = 0.5 * (Math.abs(orientation.beta) / 180);

	var debugOutput = "";
	for(var i = 0; i < ongoingtouches.length; i++)
	{
	    var touch = ongoingtouches[i];

	    touch.vX *= 0.9;
	    touch.vY *= 0.9;

	    /* Gravity with the ground */
	    touch.vX += orientationX;
	    touch.vY += orientationY;

	    /* Gravity with other points */
	    for(var j = 0; j < ongoingtouches.length; j++)
	    {
		if(i == j)
		    continue;

		var touch2 = ongoingtouches[j];

		var dist = Math.sqrt(
		    Math.pow(touch2.currentX - touch.currentX, 2) +
			Math.pow(touch2.currentY - touch.currentY, 2));
		var mult = dist < DISTANCE ? REPULSION : -ATTRACTION;

		touch.vX += mult * (touch.currentX - touch2.currentX);
		touch.vY += mult * (touch.currentY - touch2.currentY);
	    }

	    /* Move towards latest touch */
	    if(touch.identifier != -1)
	    {
		touch.vX += (touch.targetX - touch.currentX);
		touch.vY += (touch.targetY - touch.currentY);
	    }

	    /* Apply velocity */
	    touch.currentX += touch.vX * 0.1;
	    touch.currentY += touch.vY * 0.1;
	    
	    drawCircle(touch.currentX, touch.currentY);

	    if(touch.currentX < -OFFSCREEN_TOLERANCE || touch.currentY < -OFFSCREEN_TOLERANCE ||
	       touch.currentX > canvas.width+OFFSCREEN_TOLERANCE || touch.currentY > canvas.height+OFFSCREEN_TOLERANCE)
	    {
		ongoingtouches.splice(i, 1);
	    }

	}
    };

    var getTouchById = function(idToFind) {
	for(var i = ongoingtouches.length-1; i >= 0; i--)
	{
	    if(ongoingtouches[i].identifier == idToFind)
		return ongoingtouches[i];
	}
	return undefined;
    };

    var canvasResize = function() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	draw();
    };

    var touchStart = function(event) {
	event.preventDefault();
	var eTouches = event.changedTouches;

	for(var i = 0; i < eTouches.length; i++) {
	    if(ongoingtouches.length > MAX_PARTICLES)
		ongoingtouches.splice(0, 1);

	    if(getTouchById(eTouches[i].identifier) == undefined)
	    {
		ongoingtouches.push({
		    identifier: eTouches[i].identifier,
		    currentX: eTouches[i].pageX,
		    currentY: eTouches[i].pageY,
		    targetX: eTouches[i].pageX,
		    targetY: eTouches[i].pageY,
		    vX: 0,
		    vY: 0,
		    tail: new Array()
		});
	    }
	}
    };

    var touchMove = function(event) {
	event.preventDefault();
	var eTouches = event.changedTouches;

	for(var i = 0; i < eTouches.length; i++)
	{
	    var touch = getTouchById(eTouches[i].identifier);
	    touch.targetX = eTouches[i].pageX;
	    touch.targetY = eTouches[i].pageY;
	}
    };

    var touchEnd = function(event) {
	event.preventDefault();
	var touches = event.changedTouches;

	for(var i = 0; i < touches.length; i++)
	{
	    var touch = getTouchById(touches[i].identifier);
	    touch.identifier = -1;
	}
    };

    var orientationUpdate = function(event) {
	orientation = { alpha: event.alpha, beta: event.beta, gamma: event.gamma };
    };

    document.addEventListener("touchstart", touchStart, false);
    document.addEventListener("touchmove", touchMove, false);
    document.addEventListener("touchend", touchEnd, false);
    document.addEventListener("touchcancel", touchEnd, false);

    window.addEventListener("resize", canvasResize, false);
    document.addEventListener("DOMContentLoaded", draw);

    if(window.DeviceOrientationEvent) {
	window.addEventListener("deviceorientation", orientationUpdate, false);
    }

    canvasResize();

    var animate = function () {
	requestAnimFrame(animate);
	draw();
    };
    animate();
})();

