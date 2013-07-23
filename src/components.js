// An "Actor" is an entity that is drawn in 2D on canvas
//  via our logical coordinate grid
Crafty.c('Actor', {
	init: function() {
		this.requires('2D, Canvas, Center');
	},
});

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
})
 
// This is the player-controlled character
Crafty.c('PlayerCharacter', {
	
	init: function() {
		this.requires('Actor, Fourway, Collision, spr_player, Circle, Keyboard')
		.attr({ x: Game.width/2 - this._w/2, y: Game.height/2 - this._h/2, hitCircle: new Crafty.circle(this._w/2,this._h/2,this._w/2)})
		.collision(this.hitCircle)
		.fourway(3)
		.onHit('PassiveMob', this.hitPassiveMob)
	
		// init width and whatnot
		this._w = 32;
		this._h = 32;
		this.x = Game.width/2 - this._w/2;
		this.y = Game.height/2 - this._h/2;
		this.redrawHitCircle();
		
		// each frame, check if hitting boundary
		this.bind("EnterFrame", this.hitBoundary);
		
		// on NewDirection (movement changes, either presses movement key or releases) reset motion
		// right now there's a 'bounce' after the player stops moving against the edge.  Dunno why the bounce happens, but it ensures the player
		// isn't consantly colliding with edge... so i guess we're keeping it for now.
		// this.bind("NewDirection", this.resetMotion);
	
	},
	
	// when player hits a passive mob, increase width and height and redraw hitcircle, and remove passive mob
	hitPassiveMob: function(data) {
		passiveMob = data[0].obj; // this is just how we access what we hit with the onHit function
		passiveMob.playerCollided();
		this.x -= 2;
		this.y -= 2;
		this._w = this._w + 4;
		this._h = this._h + 4;
		this.redrawHitCircle();
	},
	
	redrawHitCircle: function() {
		this.hitCircle = new Crafty.circle(this._w/2, this._h/2, this._w/2);
		this.collision(this.hitCircle);
	},
	
	resetMotion: function() {
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
		this._movement.x = motionComponentX;
		this._movement.y = motionComponentY;
	},
	
	hitBoundary: function() {
		var boundary = Crafty("Boundary");
		var distanceBetweenCenters = Math.sqrt( Math.pow( this.center("x") - boundary.center("x"), 2 ) + Math.pow( this.center("y") - boundary.center("y"), 2) );
		var radiiAdded = this.hitCircle.radius + boundary.hitCircle.radius;
		var radiiSubtracted = Math.abs(boundary.hitCircle.radius - this.hitCircle.radius);
		if ( distanceBetweenCenters < radiiAdded && distanceBetweenCenters > radiiSubtracted ) {
			this.slideOnEdge(boundary);
		}
		else this.resetMotion();
	},
	
	slideOnEdge: function(boundary) {
		
		// get basic information about the line connecting the center of the player and the center of the petri dish
		var centerJoinComponentX = this.center('x') - boundary.center('x');
		var centerJoinComponentY = this.center('y') - boundary.center('y');
		var slopeOfCenterJoin = this.getSlope(centerJoinComponentY, centerJoinComponentX);
		
		// get information about tangent vector at point of collision and find unit components (vector of length 1 in direction of tangent)
		var slopeOfTangent = this.getSlope(-centerJoinComponentX, centerJoinComponentY);
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
			return;
		}
		
		var slopeOfMotion = this.getSlope(motionComponentY, motionComponentX);
		
		// use dot product to see if angle between tangent vector and motion vector is concave (reverse tangent vector if not)
		var tangentComponents = [unitComponentX, unitComponentY];
		var motionComponents = [motionComponentX, motionComponentY];
		var dotProduct = this.dotProduct(tangentComponents, motionComponents);
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
	},
	
	dotProduct: function(firstComponents, secondComponents) {
		if( !firstComponents instanceof Array || !secondComponents instanceof Array ) {
			console.error("did not pass function \'dotProduct\' two arrays");
			return nil;
		}
		if( firstComponents.length != secondComponents.length ) {
			console.error("did not pass function \'dotProduct\' two arrays of equal length");
			return nil;
		}
		var dotProduct = 0;
		for ( var i = 0 ; i < firstComponents.length ; i++ ) {
			dotProduct += firstComponents[i]*secondComponents[i];
		}
		return dotProduct;
	},
	
	getSlope: function(rise, run) {
		var slope;
		if (run === 0 && rise > 0)
		slope = Math.pow(2, 53); // Largest Integer
		else if( run === 0 && rise < 0)
		slope = Math.pow(-2, 53);
		else slope = rise / run;
		return slope;
	},
	
});

Crafty.c('PassiveMob', {
	init: function() {
		this.requires('Actor, Collision, Circle, spr_passivemob')
		.attr({ x: 200, y: 200, hitCircle: new Crafty.circle(this._w/2, this._h/2, 5), getAwayFromEdge: 0, accel: .2, maxSpeed: 2, intendedMovementX: 0, intendedMovementY: 0, movementX: 0, movementY: 0})
		.collision(this.hitCircle)
		
		this.playerCollided();
		
		this.bind("EnterFrame", this.updateMotion);
	},
	
	updateMotion: function() {
		var xAdd = this.accel * Math.random() * this.maxSpeed;
		var yAdd = this.accel * Math.random() * this.maxSpeed;
		if (Math.random() > .5) {
			xAdd = -xAdd;
		}
		if (Math.random() > .5) {
			yAdd = -yAdd;
		}
		var boundary = Crafty("Boundary");
		var centerJoinComponentX = this.center('x') - boundary.center('x');
		var centerJoinComponentY = this.center('y') - boundary.center('y');
		if (this.getAwayFromEdge > 0) {
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
		this.intendedMovementX += xAdd;
		this.intendedMovementY += yAdd;
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
		
		if (this.getAwayFromEdge == 0)
			this.hitBoundary();
		
		this.x += this.movementX;
		this.y += this.movementY;
	},
	
	playerCollided: function() {
		var proposedX = Crafty.math.randomNumber( 200, 570 );
		var proposedY = Crafty.math.randomNumber( 100, 470 );
		var player = Crafty("PlayerCharacter");
		while(proposedX > player.x - this._w && proposedX < player.x + this._w + player._w && proposedY > player.y - this._h && proposedY < player.y + player._h + this._h) {
			proposedX = Crafty.math.randomNumber( 200, 570 );
			proposedY = Crafty.math.randomNumber( 100, 470 );
		}
		this.x = proposedX;
		this.y = proposedY;
	}, 
	
	resetMotion: function() {
		this.movementX = this.intendedMovementX;
		this.movementY = this.intendedMovementY;
	},
	
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

Crafty.c('Boundary', {
	init: function() {
		this.requires('Actor, Collision, Circle, spr_boundary')
		.origin('center')
		.attr({ x: Game.width/2 - this._w/2, y: Game.height/2 - this._h/2, hitCircle: new Crafty.circle(this._w/2, this._h/2, 280)})
		.collision(this.hitCircle)
	},
});