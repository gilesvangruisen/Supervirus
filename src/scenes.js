// Game scene
// -------------
// Runs the core gameplay loop
Crafty.scene('Game', function() {
  this.boundary = Crafty.e('Boundary');
  this.player = Crafty.e('PlayerCharacter');
  Crafty.e('PassiveMob');
  Crafty.e('PassiveMob');
  Crafty.e('PassiveMob');
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
	  'assets/32x32_foreground_01.png',
	  'assets/virus_256x256.png', 
	  'assets/petri_plaincircle.png'
    ], function(){
		
		Crafty.sprite(256, 'assets/virus_256x256.png', {
			spr_player: [0, 0]
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