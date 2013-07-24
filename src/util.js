Util = {
	
	// returns slope given the components of a vector. NOTE: Y-component goes first.
	getSlope: function(rise, run) {
		var slope;
		if (run === 0 && rise > 0)
		slope = Math.pow(2, 53); // Largest Integer
		else if( run === 0 && rise < 0)
		slope = Math.pow(-2, 53);
		else slope = rise / run;
		return slope;
	},
	
	// returns the dot product of two arrays of vector components
	dotProduct: function(firstComponents, secondComponents) {
		if( !firstComponents instanceof Array || !secondComponents instanceof Array ) {
			console.error("did not pass function \'dotProduct\' two arrays");
			return null;
		}
		if( firstComponents.length != secondComponents.length ) {
			console.error("did not pass function \'dotProduct\' two arrays of equal length");
			return null;
		}
		var dotProduct = 0;
		for ( var i = 0 ; i < firstComponents.length ; i++ ) {
			dotProduct += firstComponents[i]*secondComponents[i];
		}
		return dotProduct;
	},
	
}