// An "Actor" is an entity that is drawn in 2D on canvas
//  via ou
Crafty.c('Actor', {
	init: function() {
		this.requires('2D, Canvas, Center');
	},
});

// gives the 'center' function for a 2D entity to find it's center coordinates
Crafty.c('Center', {
	init: function() {
		this.requires('2D, Canvas');
	},
	center: function(component) {
		if(component==="x")
		return this._x + this._w/2;
		if(component==="y")
		return this._y + this._h/2;
		else
		console.error("must specify \'x\' or \'y\' for function \'center\'");
	},
});

// gives collision detection via a bounding circle
// for now assumes: center of hit circle is center of sprite, radius function only uses properties of "this" instead of local vars
Crafty.c('HitCircle', {
	init: function() {
		this.requires('Collision')
		.attr({_radiusFunction: "", hitCircle: null})
		.radiusFunction("this._w/2")
	},
	
	// entities that use this must call this in their init method and pass a string representation of the function to calculate the radius
	radiusFunction: function(rf) {
		this._radiusFunction = rf;
		this.redrawHitCircle();
		return this;
	},
	
	// for when the width and height change
	redrawHitCircle: function() {
		this.hitCircle = new Crafty.circle(this._w/2, this._h/2, eval(this._radiusFunction));
		this.collision(this.hitCircle);
	},
});

Crafty.c('HeadsUpDisplay', {
	init: function() {
		this.requires('Actor, Text')
		.attr({ x: Crafty.viewport.x + 20, y: Crafty.viewport.y + 20, score: 0 })
		.text("Score: " + this.score)
	},
	
	scoreUp: function(amount) {
		this.score += amount;
		this.text("Score: " + this.score);
		this.recenter();
	},
	
	recenter: function() {
		this.x = -Crafty.viewport.x + 20;
		this.y = -Crafty.viewport.y + 20;
	}
	
});
 
// This is the player-controlled character
Crafty.c('PlayerCharacter', {
	
	init: function() {
		/*
		* Actor: Bundles together 2D, Canvas, Center
		* Fourway: WASD and Arrow Key input moves this entity
		* HitCircle: above
		* spr_player: uses this sprite loaded in the Loading scene of scenes.js
		* Keyboard: for detection of key presses and lifts
		*/
		this.requires('Actor, Fourway, HitCircle, spr_player, Keyboard')
		.attr({ x: Game.width/2 - this._w/2, y: Game.height/2 - this._h/2 }) // .attr initializes fields in this entity object
		.radiusFunction("this._w/2") // initiate HitCircle and tell it how to calculate the radius from now on
		.fourway(5) // initialize the keyboard input motion system with a speed in pixels per tick
		.onHit('PassiveMob', this.hitPassiveMob) // translation: when we collide with an entity called 'PassiveMob' execute function 'this.hitPassiveMob'
	
		// init width and height (defaults to sprite size which is much bigger)
		this._w = 32;
		this._h = 32;
		
		// re-init x and y based on updated width and height
		this.x = Game.width/2 - this._w/2;
		this.y = Game.height/2 - this._h/2;
		this.redrawHitCircle(); // HitCircle function
		
		// each frame, check if hitting boundary
		this.bind("EnterFrame", this.hitBoundary);
		
		// on NewDirection (movement changes; either presses movement key or releases) reset motion
		this.bind("NewDirection", this.resetMotion);
		
		// sidescrolling action: change boundary location when moving
		this.bind("Move", this.moveBoundary);
		
	},
	
	moveBoundary: function(data) {
		Crafty.viewport.scroll('_x', -(this.x + (this.w / 2) - (Crafty.viewport.width / 2) ));
		Crafty.viewport.scroll('_y', -(this.y + (this.h / 2) - (Crafty.viewport.height / 2) ));
	},
	
	// when player hits a passive mob, increase width and height and redraw hitcircle, and remove passive mob
	hitPassiveMob: function(data) {
		
		Crafty("HeadsUpDisplay").scoreUp(1);
		
		passiveMob = data[0].obj; // this is just how we access what we hit with the onHit function
		passiveMob.playerCollided(); // let the collided mob know we hit them so they can disappear or whatever
		
		// increase size of player.  the decrease of x and y is to show growth from all sides, not just expansion of the bottom right of the sprite
		this.x -= .5;
		this.y -= .5;
		this._w = this._w + 1;
		this._h = this._h + 1;
		
		// new _w and _h, gotta redraw the hit circle for collision detection
		this.redrawHitCircle();
		this.hitBoundary();
		
		this.customZoom(0.995);
		
		// var xshould = Crafty.viewport.x;
		// var yshould = Crafty.viewport.y;
		// 
		// console.log("");
		// console.log("BEFORE: " + Crafty.viewport.x + ", " + Crafty.viewport.y + " --- " + Crafty.viewport.width + ", " + Crafty.viewport.height);
		// 
		// Crafty.viewport.zoom(.99, this.center("x"), this.center("y"), 5);
		// 		
		// Crafty.viewport.scale(.99);
		// 
		// console.log(Crafty(0).toString());
		// 
		// Crafty.viewport.x = xshould;
		// Crafty.viewport.y = yshould;
		// Crafty.viewport.width = Game.width;
		// Crafty.viewport.height = Game.height;
		// 
		// Crafty.viewport.reload();

		// console.log("AFTER: " + Crafty.viewport.x + ", " + Crafty.viewport.y + " --- " + Crafty.viewport.width + ", " + Crafty.viewport.height);
	},
	
	customZoom: function(factor) {
		Crafty("2D").each( function(i) {
			// console.log("");
			// console.log(this.x + ", " + this.y + ", " + factor + ", " + this._w + ", " + this._h);
			this.x += (1 - factor) * this._w/2;
			this.y += (1 - factor) * this._h/2;
			this._w *= factor;
			this._h *= factor;
			// console.log(this.x + ", " + this.y + ", " + factor + ", " + this._w + ", " + this._h);
		});
		Crafty("HitCircle").each( function(i) {
			this.redrawHitCircle();
		});
	},
	
	// for some reason when we hit the boundary we get a permanent movement value in the opposite direction, so this resets motion based on keyboard input
	resetMotion: function() {
		var motionComponentX = 0;
		var motionComponentY = 0;
		// the 'this.isDown' method is made possible by including the 'Keyboard' component
		if (this.isDown("UP_ARROW")) {
			motionComponentY = -this._speed.y;
		}
		else if (this.isDown("DOWN_ARROW")) {
			motionComponentY = this._speed.y;
		}
		if (this.isDown("RIGHT_ARROW")) {
			motionComponentX = this._speed.x;
		}
		else if (this.isDown("LEFT_ARROW")) {
			motionComponentX = -this._speed.x;
		}
		this._movement.x = motionComponentX;
		this._movement.y = motionComponentY;
	},
	
	// each frame, check if we're colliding with the boundary
	hitBoundary: function() {
		
		// this is how we locate an entity with Crafty.  If there are multiple of these entities, an array is returned (only gonna be 1 boundary tho)
		var boundary = Crafty("Boundary"); 
		
		// don't forget to be awesome at math
		var distanceBetweenCenters = Math.sqrt( Math.pow( this.center("x") - boundary.center("x"), 2 ) + Math.pow( this.center("y") - boundary.center("y"), 2) );
		var radiiAdded = this.hitCircle.radius + boundary.hitCircle.radius;
		var radiiSubtracted = Math.abs(boundary.hitCircle.radius - this.hitCircle.radius);
		
		// we're colliding!
		if ( distanceBetweenCenters < radiiAdded && distanceBetweenCenters > radiiSubtracted ) { 
			this.slideOnEdge(boundary);
		}
		
		else { 
			this.resetMotion(); // this prevents permanent movement change from slideOnEdge
		}
	},
	
	// this function is probably my proudest moment as a coder / mathematician / poet / argonaut / donkey show.
	slideOnEdge: function(boundary) {
		
		// get basic information about the line connecting the center of the player and the center of the petri dish
		var centerJoinComponentX = this.center('x') - boundary.center('x');
		var centerJoinComponentY = this.center('y') - boundary.center('y');
		var slopeOfCenterJoin = Util.getSlope(centerJoinComponentY, centerJoinComponentX);
		
		// get information about tangent vector at point of collision and find unit components (vector of length 1 in direction of tangent)
		var slopeOfTangent = Util.getSlope(-centerJoinComponentX, centerJoinComponentY);
		var tangentMagnitude = Math.sqrt(Math.pow(centerJoinComponentY, 2) + Math.pow(centerJoinComponentX, 2));
		var unitComponentX = centerJoinComponentY / tangentMagnitude;
		var unitComponentY = - centerJoinComponentX / tangentMagnitude;
		
		// get information about motion vector as intended by keyboard input
		var motionComponentX = 0;
		var motionComponentY = 0;
		if (this.isDown("UP_ARROW")) {
			motionComponentY = -this._speed.y;
		}
		else if (this.isDown("DOWN_ARROW")) {
			motionComponentY = this._speed.y;
		}
		if (this.isDown("RIGHT_ARROW")) {
			motionComponentX = this._speed.x;
		}
		else if (this.isDown("LEFT_ARROW")) {
			motionComponentX = -this._speed.x;
		}
		
		// if keyboard doesn't dictate any motion, don't move.
		if (motionComponentX == 0 && motionComponentY == 0) {
			this._movement.x = 0;
			this._movement.y = 0;
			this.stayAtEdgeWhileColliding(); // make sure we're exactly at edge
			return;
		}
		
		var slopeOfMotion = Util.getSlope(motionComponentY, motionComponentX);
		
		// use dot product to see if angle between tangent vector and motion vector is concave (reverse tangent vector if not)
		var tangentComponents = [unitComponentX, unitComponentY];
		var motionComponents = [motionComponentX, motionComponentY];
		var dotProduct = Util.dotProduct(tangentComponents, motionComponents);
		if (dotProduct < 0) { // means angle between vectors is convex
			unitComponentX = -unitComponentX;
			unitComponentY = -unitComponentY;
			dotProduct = -dotProduct;
		}
		
		// since we used a unit vector for the tangent, scalarProjection = dotProduct.  
		var scalarProjection = dotProduct;
		
		// use scalar projection to find corrected motion components 
		var correctedMotionX = Math.sqrt( Math.pow(scalarProjection, 2) / (1 + Math.pow(slopeOfTangent, 2)));
		var correctedMotionY = slopeOfTangent * correctedMotionX;
		
		// we get the absolute value of the components above, need to find the direction
		if (unitComponentX < 0) {
			correctedMotionX = -correctedMotionX;
		}
		if (unitComponentY < 0) {
			correctedMotionY = -correctedMotionY;
		}
		
		// this is a bug with the above code, figure out the maths behind why this is happening, fix that, then delete this quickfix
		if ( centerJoinComponentX > 0 && centerJoinComponentY > 0 ) {
			correctedMotionY = -correctedMotionY;
		}
		if ( centerJoinComponentX < 0 && centerJoinComponentY < 0 ) {
			correctedMotionY = -correctedMotionY;
		}
		
		// change motion components
		this._movement.x = correctedMotionX;
		this._movement.y = correctedMotionY;
		
		// make sure we're exactly at edge
		this.stayAtEdgeWhileColliding();
		
	},
	
	stayAtEdgeWhileColliding: function() {
		var boundary = Crafty("Boundary");
		var centerJoinComponentX = this.center('x') - boundary.center('x');
		var centerJoinComponentY = this.center('y') - boundary.center('y');
		var correctMagnitude = boundary.hitCircle.radius;
		var currentMagnitude = this.hitCircle.radius + Math.sqrt( Math.pow( this.center("x") - boundary.center("x"), 2 ) + Math.pow( this.center("y") - boundary.center("y"), 2) );
		var magnitudeCorrection = 1 - (correctMagnitude/currentMagnitude);
		var xCorrection = -centerJoinComponentX * magnitudeCorrection;
		var yCorrection = -centerJoinComponentY * magnitudeCorrection;
		this.x += xCorrection;
		this.y += yCorrection;
	}
	
});

// edible passive mobs. 
Crafty.c('PassiveMob', {
	init: function() {
		this.requires('Actor, HitCircle, spr_mob')
		.attr({ x: 200, y: 200, getAwayFromEdge: 0, accel: .05, maxSpeed: 4, intendedMovementX: 0, intendedMovementY: 0, movementX: 0, movementY: 0})
		.radiusFunction("this._w/2");
		
		this._w = 32;
		this._h = 32;
		this.redrawHitCircle();
		
		// start game by randomizing position
		this.playerCollided();
		
		this.bind("EnterFrame", this.updateMotion);
	},
	
	updateMotion: function() {
		
		// each frame, add or subtract a bit from the movement components to achieve erratic motion
		var xAdd = this.accel * Math.random() * this.maxSpeed;
		var yAdd = this.accel * Math.random() * this.maxSpeed;
		if (Math.random() > .5) {
			xAdd = -xAdd;
		}
		if (Math.random() > .5) {
			yAdd = -yAdd;
		}
		
		// getAwayFromEdge is set when this hits the boundary -- for an amount of frames after said collision we need to guide this away from boundary.
		if (this.getAwayFromEdge > 0) {
			
			// find the direction toward the center of the boundary
			var boundary = Crafty("Boundary");
			var centerJoinComponentX = this.center('x') - boundary.center('x');
			var centerJoinComponentY = this.center('y') - boundary.center('y');
			
			// point the additions in the general direction of the center of the boundary
			if (centerJoinComponentX > 0) {
				xAdd = -Math.abs(xAdd);
			}
			else {
				xAdd = Math.abs(xAdd);
			}
			if (centerJoinComponentY > 0) {
				yAdd = -Math.abs(yAdd);
			}
			else {
				yAdd = Math.abs(yAdd);
			}
			
			this.getAwayFromEdge -= 1;
		}
		
		// will need to separate intended movement and actual movement if we want to update edge sliding for NPCs, for now it's redundant with movement
		this.intendedMovementX += xAdd;
		this.intendedMovementY += yAdd;
		
		// make sure we're within the bounds of our max speed
		if (this.intendedMovementX > this.maxSpeed) {
			this.intendedMovementX = this.maxSpeed;
		}
		else if (this.intendedMovementX < -this.maxSpeed) {
			this.intendedMovementX = -this.maxSpeed;
		}
		if (this.intendedMovementY > this.maxSpeed) {
			this.intendedMovementY = this.maxSpeed;
		}
		else if (this.intendedMovementY < -this.maxSpeed) {
			this.intendedMovementY = -this.maxSpeed;
		}
		
		this.movementX = this.intendedMovementX;
		this.movementY = this.intendedMovementY;
		
		// if we're not currently getting away from the edge, check if we're hitting the boundary
		if (this.getAwayFromEdge == 0) {
			this.hitBoundary();
		}
		
		// actually move
		this.x += this.movementX;
		this.y += this.movementY;
	},
	
	// called by PlayerCharacter when colliding with this, resets location
	playerCollided: function() {
		
		var boundary = Crafty("Boundary");
		var player = Crafty("PlayerCharacter");
		
		// find the square bounded by the boundary's hitCircle to know the outer bounds of where mob can spawn
		var spread = boundary.hitCircle.radius / Math.sqrt(2);
		
		var proposedX;
		var proposedY;
		var withinFrame;
		
		var viewportRect = {
			x: -Crafty.viewport.x,
			y: -Crafty.viewport.y,
			w: Game.width,
			h: Game.height
		}
		
		var spreadRect = {
			x: boundary.center("x") - spread,
			y: boundary.center("y") - spread,
			w: spread*2,
			h: spread*2
		}
		
		if ( Util.rectContainedInRect(spreadRect, viewportRect) ) {
			// if(Game.isTrue) {
			Game.mobArray.splice(Game.mobArray.indexOf(this),1);
			this.destroy();
			Game.checkIfWon();
			return;
		}
		
		var angle;
		var mag;
		
		do {
			
			// find vector to random spot in boundary
			angle = 2* Math.PI * Math.random();
			mag = Math.random() * boundary.hitCircle.radius;
			proposedX = mag * Math.cos(angle);
			proposedY = mag * Math.sin(angle);			
			
			// add to center of boundary
			proposedX += boundary.center('x');
			proposedY += boundary.center('y');
			
			if (proposedX > -Crafty.viewport.x && proposedX < -Crafty.viewport.x + Crafty.viewport.width && proposedY > -Crafty.viewport.y && proposedY < -Crafty.viewport.y + Crafty.viewport.height) {
				withinFrame = true;
			}
			else {
				withinFrame = false;
			}
		} while(withinFrame)
		
		this.x = proposedX;
		this.y = proposedY;
	}, 
	
	// for now redundant
	resetMotion: function() {
		this.movementX = this.intendedMovementX;
		this.movementY = this.intendedMovementY;
	},
	
	// check if this is hitting boundary, initiate getAwayFromEdge if so to ensure no escaping the boundary
	hitBoundary: function() {
		var boundary = Crafty("Boundary");
		var distanceBetweenCenters = Math.sqrt( Math.pow( this.center("x") - boundary.center("x"), 2 ) + Math.pow( this.center("y") - boundary.center("y"), 2) );
		var radiiAdded = this.hitCircle.radius + boundary.hitCircle.radius;
		var radiiSubtracted = Math.abs(boundary.hitCircle.radius - this.hitCircle.radius);
		if ( distanceBetweenCenters < radiiAdded && distanceBetweenCenters > radiiSubtracted ) {
			this.intendedMovementX = 0;
			this.intendedMovementY = 0;
			this.movementX = 0;
			this.movementY = 0;
			this.getAwayFromEdge = 4;
			// this.slideOnEdge(boundary);
		}
		// else this.resetMotion();
	},
	
});

// this is the petri dish circular boundary
Crafty.c('Boundary', {
	init: function() {
		this.requires('Actor, HitCircle, spr_boundary')
		.origin('center')
		.attr({ x: Game.width/2 - this._w/2, y: Game.height/2 - this._h/2})
		.radiusFunction("this._w/2 - this._w/58");
			
		this._w = 1200;
		this._h = 1200;
		this.x = Game.width/2 - this._w/2;
		this.y = Game.height/2 - this._h/2;
			
		this.redrawHitCircle();
	},
});
	
	
	