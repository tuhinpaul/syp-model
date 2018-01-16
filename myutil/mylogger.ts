export default class MyLogger
{
	constructor() {

	}

	private newline() {
		console.log()
	}

	log(x?) : void {
		// If no argument is provided
		if ( typeof(x) == 'undefined' )
			return console.log()
		else
			return console.log(x)
	}

	// adds an extra newline
	logln(x?) : void {
		this.log(x)
		this.newline();
	}
}
