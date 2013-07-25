// Game scene
// -------------
// Runs the core gameplay loop
Crafty.scene('Game', function() {
  Game.boundary = Crafty.e('Boundary');
  Game.player = Crafty.e('PlayerCharacter');
  Game.mobArray = new Array();
  Game.isTrue = false;
  for (var i = 0 ; i < 14 ; i++) {
	  Game.mobArray[i] = (Crafty.e('PassiveMob'));
	  Game.mobArray[i]._w = 10 + 2*i;
	  Game.mobArray[i]._h = 10 + 2*i;
	  Game.mobArray[i].redrawHitCircle();
  }
  Game.isTrue = true;
  Game.headsUpDisplay = Crafty.e('HeadsUpDisplay');
  Game.player.attach(Game.headsUpDisplay);
  
});

// Victory scene
// -------------
// To be shown when the player wins the game
Crafty.scene('Victory', function() {
	
	Crafty("2D").each( function(i) {
		this.destroy();
	});
	
	console.log("what?");
	
	
	
	Crafty.e('2D, DOM, Text')
	.text('u fakkin won, kid')
	.attr({x: Game.width/2 - this._w/2, y: Game.height/2 - this._h/2})
	.css($text_css);
});
 
// Loading scene
// -------------
// Handles the loading of binary assets such as images and audio files
Crafty.scene('Loading', function(){
  // Draw some text for the player to see in case the file
  //  takes a noticeable amount of time to load
  Crafty.e('2D, DOM, Text')
    .text('Loading; please wait...')
    .attr({ x: 0, y: Game.height/2 - 24, w: Game.width })
    .css($text_css);
 
 	
  // Load our sprite map image
  Crafty.load([
	  'assets/passivemob_256x256.png',
	  'assets/32x32_foreground_01.png',
	  'assets/virus_256x256.png', 
	  'assets/petri_plaincircle.png'
    ], function(){
		
		Crafty.sprite(256, 'assets/virus_256x256.png', {
			spr_player: [0, 0]
		});
		
		Crafty.sprite(256, 'assets/passivemob_256x256.png', {
			spr_mob: [0, 0]
		});
		
    Crafty.sprite(32, 'assets/32x32_foreground_01.png', {
	  spr_passivemob: [1, 0]
    });
	
	Crafty.sprite(580, 'assets/petri_plaincircle.png', {
		spr_boundary: [0, 0]
	});
	
    Crafty.scene('Game');
	
  })
});