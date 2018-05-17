import * as mysql from 'mysql'

import MyLogger from './myutil/mylogger'
let logger = new MyLogger(true);


export default class Model
{
	private className: string
	public tablename : string
	public fields: string[]
	public fValues = {}

	private whereArr = {}
	private likeArr = {} // values are wildcards indicating wether/not wildcards should be applied to the corresponding value in whereArr.
	private orderBy:string[] = []

	private static connConf  = null
	private static modelConf = null

	public static config(connConf, modelConf) {
		Model.connConf = connConf
		Model.modelConf = modelConf;
	}

	protected constructor() {
		// Do nothing for factory generated models
		// because initializations will be taken care of
		// by the factory method
		if (this.constructor.name == "Model") {

		}
		else {
			this.className = this.constructor.name;
			this.initialize();
		}
	}

	private initialize() {

		/* Make sure that model configuration exists */
		// if Model.config() was not called OR was not provided model conf:
		if(! Model.modelConf) {

			// if process environment contains a model file, use that
			if (process.env.hasOwnProperty('sypmodel-model-conf-file'))
				Model.modelConf = require( process.env['sypmodel-model-conf-file'] )
			else
				throw "Model configurations are not provided."
		}

		if (! Model.modelConf.hasOwnProperty(this.className))
			throw "Unknown model " + this.className + "!"
		
		this.tablename = Model.modelConf[this.className]['tablename']
		this.fields = Model.modelConf[this.className]['columns']
		this.fValues =  {}

		this.whereArr = {}
	}

	static factory(className: string): Model {

		let m = new Model()
		m.className = className
		m.initialize()

		return m
	}

	static emptyModel(): Model {
		return new Model()
	}


	assign(property: string, value: any): Model {
		if (this.fields.indexOf(property) > -1)
			this.fValues[property] = value;
		else
			throw "Property " + property + " does not exist!"
		
		// allow coalescing

		return this;
	}

	assignAll(properties: Object): Model {

		for (let p in properties) {
			if (! properties.hasOwnProperty(p))
				continue;

			if (this.fields.indexOf(p) > -1)
				this.fValues[p] = properties[p];
			else
				throw "Property " + p + " does not exist!"
		}

		// allow coalescing

		return this;
	}

	valueOf(property: string): any {
		if (this.fields.indexOf(property) > -1)
			return this.fValues[property]
		else
			throw "Property " + property + " does not exist!"
	}

	static execute(stmt: String, params: any|any[]): Promise<any>
	{
		/* Make sure that database connection configuration exists */
		// if Model.config() was not called OR was not provided database connection conf:
		if(! Model.connConf) {

			// if process environment contains a model file, use that
			if (process.env.hasOwnProperty('sypmodel-conn-conf-file'))
				Model.connConf = require( process.env['sypmodel-conn-conf-file'] )
			else
				throw "Database connection configurations are not provided."
		}

		logger.log('Statement executed:')
		logger.logln(stmt)
		logger.log('Parameters:')
		logger.logln(params)

		return new Promise((resolve, reject) =>
		{
			let conn = mysql.createConnection(Model.connConf);

			conn.connect();

			// check: https://github.com/mysqljs/mysql/issues/528
			let query = conn.query(stmt, params, function (error, results, fields)
			{
				if (error) {
					logger.logln(error)
					conn.end();
					return reject(error);
				}
				conn.end();
				return resolve(results);
			});
		});
	}

    create() : Promise<any>
	{
		var cols : string[] = [];
		var vals = {};
		var placeholders : (string|number)[] = [];


		this.fields.forEach ( col => {
			if ( this.fValues.hasOwnProperty(col) ) {
				cols.push(col)
				vals[col] = this.fValues[col]
				placeholders.push(':'+col)
			}
		});

		if ( cols.length === 0 )
			throw 'no value was assigned to any column';

		var stmt = ['insert into', this.tablename, 'set ?'].join(' ');

		return Model.execute(stmt, vals);
	}

    update() : Promise<any>
	{
		var cols : string[] = [];
		var vals = {};
		var placeholders : (string|number)[] = [];


		this.fields.forEach( col => {
			if ( col != 'id' && this.fValues.hasOwnProperty(col) ) {
				cols.push(col)
				vals[col] = this.fValues[col]
				placeholders.push(':'+col)
			}
		});

		if ( cols.length === 0 )
			throw 'no value was assigned to any column';

		var stmt = ['update', this.tablename, 'set ? where id = ?'].join(' ');
		return Model.execute(stmt, [vals, this.fValues['id']]);
	}


	deleteById() : Promise<any>
	{
		var stmt = ['delete from', this.tablename, 'where id = ?'].join(' ');
		return Model.execute(stmt, this.fValues['id']);
	}

	deleteManyById(ids: number[]) : Promise<any>
	{
		if (ids.length > 0) {

			let placeholders = [];
			ids.forEach(element => {
				placeholders.push('?')
			});

			let placeholderPart = "(" + placeholders.join(', ') + ")"

			var stmt = ['delete from', this.tablename, 'where id in', placeholderPart].join(' ');
			return Model.execute(stmt, ids);
		}
		else
			return new Promise ( (resolve, reject) => {
				resolve(null)
			});
	}

	/**
	 * Deletes records based on the column name provided as argument.
	 * 
	 * @param fieldName the name of the column which is used in the where clause of delete query.
	 * The table name and column value to use for deletion will be taken from the invoking object.
	 * 
	 * @return promise that resolves to the result of the delete query.
	 */
	deleteByField(fieldName: string) : Promise<any>
	{
		var stmt = ['delete from', this.tablename, 'where', fieldName, '= ?'].join(' ');
		return Model.execute(stmt, this.fValues[fieldName]);
	}


	/**
	 * Returns the object that matches the ID of the invoking model
	 * 
	 * @return a promise that resolves to the the object which matches the id of the invoking model. If no record is found, the promise resolves to null. 
	 */
	selectById() : Promise<any>
	{
		var stmt = ['select * from', this.tablename, 'where id = ?'].join(' ');
		stmt = this.addOrderCmd(stmt)
		return Model.execute(stmt, this.fValues['id']).then( result => {
			if (result instanceof Array && result.length == 1) {
				return Promise.resolve(result[0])
			}
			else
				return Promise.resolve(null)
		})
		.catch( err => Promise.reject(err) );
	}

	where(wObj: any) : Model
	{
		Object.assign(this.whereArr, wObj)
		return this
	}

	setLikeArray (likeArr) : Model
	{
		this.likeArr = likeArr
		return this
	}

	/**
	 * Sets ordering parameter
	 * 
	 * @param ordering: can be a string or an array of strings or an object. \
	 * ordering can be a string such as 'order_no desc' OR
	 * it can be a string array such as ['date desc', 'order_no asc'] OR
	 * it can be an object such as {"date":  "desc", "order_no": "asc"}
	 * 
	 * @return the model itself
	 */
	order(ordering: string | string[] | Object) : Model
	{
		if ( this.isString(ordering) ) {
			this.orderBy.push(ordering as string)
		}
		else if ( this.isArray(ordering) ) {
			(ordering as string[]).forEach(o => {
				this.orderBy.push(o as string)
			});			
		}
		else if ( this.isObject(ordering) ) {
			let x = ordering as Object;
			for(let p in x) {
				if ( x.hasOwnProperty(p) )
					this.orderBy.push( p + ' ' + x[p] )
			}
		}

		return this
	}


	/**
	 * Finds records from the database
	 * 
	 * @return a promise that resolves to the returned records
	 */
	select() : Promise<any>
	{
		// basic select all statement
		let stmt = ['select * from', this.tablename].join(' ');

		// add where clause
		let wclause : string[] = [];
		let wValues : any[] = [];
		for (let f in this.whereArr)
		{
			if(f in this.likeArr) {
				wclause.push( f + " like ?");

				// apply wildcards
				if (this.likeArr[f])
					wValues.push( '%' + this.whereArr[f] + '%');
				else // NO wildcards
					wValues.push( this.whereArr[f]);
			}
			
			else if(this.whereArr[f] && this.whereArr[f].hasOwnProperty("in")) {
				// in clause

				// check if array was provided as the value:
				if(this.whereArr[f]["in"].constructor != Array) {
					let error = "wrong value for in clause";
					return Promise.reject(error);
				}

				if(this.whereArr[f]["in"].length > 0) {
					let placeholders = Array(this.whereArr[f]["in"].length).fill('?');
					
					wclause.push( f + " in (" + placeholders + ")")

					for(let key in this.whereArr[f]["in"])
						wValues.push(this.whereArr[f]["in"][key]);
				}
			}
	

			else {
				wclause.push( f + " = ?");
				wValues.push( this.whereArr[f]);
			}
		}

		if(wclause.length > 0)
			stmt = stmt + ' where ' + wclause.join(' and ');

		stmt = this.addOrderCmd(stmt)
		return Model.execute(stmt, wValues);
	}

	addOrderCmd(stmt) {
		if (this.orderBy.length > 0)
			stmt = stmt + ' order by ' + this.orderBy.join(',');
		return stmt;
	}


	/**
	 * Insert more than one record
	 * valueArr: should be a 2D array of values for the columns
	 */
	public static insertMany(modelName, columns, valueArr) {

		console.log("valueArr in insertMany(): ")
		console.log(valueArr)

		let tablename = Model.modelConf[modelName]['tablename'];
		let colStr = "(`" + columns.join("`, `") + "`)";

		let phArr = []
		let flatVals = []
		let numRows = valueArr.length;
		for (let i=0; i<numRows; i++) {
			let ph = Array(valueArr[i].length).fill('?')
			phArr.push('(' + ph.join(',') + ')');
			flatVals = flatVals.concat(valueArr[i]);
		}

		let stmt = "insert into " + tablename + colStr + " values " + phArr.join(",");
		console.log("stmt:")
		console.log(stmt);

		console.log("flatvalues:")
		console.log(flatVals)

		return Model.execute(stmt, flatVals);
	}

	/**
	 * Promise to GET the first matching object from DB table
	 */
	public static promiseGetOne(oInstance: Model, keyName: string) {
		return new Promise ( (resolve, reject) => {
			oInstance.select()
			.then( result => {
				if (result.length < 1) // TODO: why should there be many?
					reject({message: "Wrong number of " + oInstance.constructor.name + "!"});
				else {
					let obj = {}
					obj[keyName] = result[0]
					return resolve( obj );
				}
			})
			.catch ( err => {
				reject(err);
			});
		});
	}

	/**
	 * Promise to GET all objects from DB table
	 * indexed by PK by defaule
	 * 
	 * @param modelNameOrInstance can be either a model name or model instance. If it's a model name, an instance is created using Model.factory()
	 * @param indexBy how to index the objects in the returned list of objects
	 * @param isArrayMember is an index can be associated with multiple objects
	 */
	public static promiseGetAll(modelNameOrInstance: String|Model, indexBy: string = 'id', isArrayMember:boolean = false) {

		let oInstance: Model

		if(modelNameOrInstance.constructor === String)
			oInstance = Model.factory(modelNameOrInstance as string)
		else
			oInstance = modelNameOrInstance as Model;

		return new Promise ( (resolve, reject) => {
			oInstance.select()
			.then( result => {

				let oRet = {}
				let k = oInstance.tablename + ''
				let resultByPK = {}
				for (let i in result) {
					let key = result[i][indexBy]

					if (isArrayMember)
						if(! resultByPK.hasOwnProperty(key))
							resultByPK[key] = []

					if(isArrayMember)
						resultByPK[key].push( result[i] )
					else
						resultByPK[key] = result[i]
				}
				oRet[k] = resultByPK
				resolve(oRet);
			})
			.catch ( err => {
				reject(err);
			});
		});
	}

	/**
	 * Promise to add all objects from DB table
	 * 
	 * 
	 * @param modelNameOrInstance can be either a model name or model instance. If it's a model name, an instance is created using Model.factory()
	 * @param indexBy how to index the objects in the returned list of objects
	 * @param isArrayMember is an index can be associated with multiple objects
	 * 
	 * @returns a function, which takes an object argument and returns a promise. The promise resolves to the argument object with records added to it.
	 */
	public static promiseAddAll(modelNameOrInstance: String|Model, indexBy: string = 'id', isArrayMember: boolean = false): ((pool: any) => Promise<any>) {
		let oInstance: Model

		if(modelNameOrInstance.constructor === String)
			oInstance = Model.factory(modelNameOrInstance as string)
		else
			oInstance = modelNameOrInstance as Model;

		return function(pool:any) {
			return new Promise ( (resolve, reject) => {
				oInstance.select()
				.then( result => {
					let k = oInstance.tablename + ''

					let resultByPK = {}
					for (let i in result) {
						let key = result[i][indexBy]

						if (isArrayMember)
							if(! resultByPK.hasOwnProperty(key))
								resultByPK[key] = []

						if(isArrayMember)
							resultByPK[key].push( result[i] )
					else
						resultByPK[key] = result[i]
					}

					pool[k] = resultByPK

					resolve(pool);
				})
				.catch ( err => {
					reject(err);
				});
			});
		}
	}

	public static promiseAddById(modelNameOrInstance: String|Model, id:number, keyName: string) {
		let oInstance: Model

		if(modelNameOrInstance.constructor === String)
			oInstance = Model.factory(modelNameOrInstance as string)
		else
			oInstance = modelNameOrInstance as Model;

		return function(pool:any) {
			return new Promise ( (resolve, reject) => {

				if (! id) {
					logger.logln('Error: id is not set in promiseAddById(...)')

					pool[keyName] = null
					return resolve(pool);
				}

				oInstance.fValues['id'] = id;
				oInstance.selectById()
				.then( result => {

					// logger.log('(promiseAddById) result')
					// logger.logln(result)

					pool[keyName] = result
					return resolve(pool);
				})
				.catch( err => {
					logger.log('Error occurred: ')
					logger.logln(err)
					
					return reject(err);
				});
			});
		}
	}
	
	public static promiseAddOne(oInstance: Model, keyName: string) {
		return function(pool:any) {
			return new Promise ( (resolve, reject) => {

				oInstance.select()
				.then( result => {
					if (result.length < 1) // TODO: why should there be many?
						pool[keyName] = null
					else
						pool[keyName] = result[0]
					return resolve(pool);
				})
				.catch( err => {
					logger.log('Error occurred: ')
					logger.logln(err)

					return reject(err);
				});
			});
		}
	}


	// checking datatypes:
	//   isString (value)
	//   isArray  (value)
	//   isObject (value)
	// check more: https://www.webbjocke.com/javascript-check-data-types/
	private isString (value) {
		return typeof value === 'string' || value instanceof String;
	};

	private isArray (value) {
		return value && typeof value === 'object' && value.constructor === Array;
	};

	private isObject (value) {
		return value && typeof value === 'object' && value.constructor === Object;
	};
}
