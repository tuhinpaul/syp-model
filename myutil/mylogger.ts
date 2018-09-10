export default class MyLogger
{
	/* you may enable/disable logging */
	isEnabled = null;

	constructor(enabled = true) {
		this.isEnabled = enabled;
	}

	/**
	 * print a newline
	 */
	private newline() {
		console.log()
	}

	/**
	 * Log data
	 * @param x? data to log. If no argument is given, a newline is logged.
	 */
	log(x?) : void {
		if (! this.isEnabled)
			return

		// If no argument is provided
		if ( typeof(x) == 'undefined' )
			return console.log()
		else
			return console.log(x)
	}

	/**
	 * Log with an extra newline
	 * @param x? data to log. If no argument is given, two newlines are logged.
	 */
	logln(x?) : void {
		if (! this.isEnabled)
			return

		this.log(x)
		this.newline();
	}
}
