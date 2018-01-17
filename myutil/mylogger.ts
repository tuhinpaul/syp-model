export default class MyLogger
{
	/* you may enable/disable logging */
	isEnabled = null;

	constructor(enabled = true) {
		this.isEnabled = enabled;
	}

	private newline() {
		console.log()
	}

	log(x?) : void {
		if (! this.isEnabled)
			return

		// If no argument is provided
		if ( typeof(x) == 'undefined' )
			return console.log()
		else
			return console.log(x)
	}

	// adds an extra newline
	logln(x?) : void {
		if (! this.isEnabled)
			return

		this.log(x)
		this.newline();
	}
}
