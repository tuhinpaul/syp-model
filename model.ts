import * as mysql from 'mysql'

import MyLogger from './myutil/mylogger'
let logger = new MyLogger();

// const modelConf = require('../../conf/model')

// const dbConf = require('../../conf/db.json') // TODO: include (automatically) conf dir in build dir

export default class Model
{
	private className: string
	public tablename : string
	public fields: string[]
	public fValues = {}

	private whereArr = {}
	private likeArr = {} // values are wildcards indicating wether/not wildcards should be applied to the corresponding value in whereArr.
	private orderBy:string[] = []

	private static connectionParameters = null
	private static modelConf = null

	public static config(connectionParameters, modelConf) {
		Model.connectionParameters = connectionParameters
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

		if (! Model.connectionParameters)
			throw "DB Connection parameters are not set."

		if(! Model.modelConf)
			throw "Model configurations are not provided."

		if (! Model.modelConf.hasOwnProperty(this.className))
			throw "Unknown model!"
		
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


	assign(property: string, value) {
		if (this.fields.indexOf(property) > -1)
			this.fValues[property] = value;
		else
			throw "Property " + property + " does not exist!"
	}

	execute(stmt: String, params: any|any[]): Promise<(resolve, reject)=>{}>
	{
		logger.log('Statement executed:')
		logger.logln(stmt)
		logger.log('Parameters:')
		logger.logln(params)

		return new Promise((resolve, reject) =>
		{
			let conn = mysql.createConnection(Model.connectionParameters);

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

    create() : Promise<(resolve, reject)=>{}>
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

		return this.execute(stmt, vals);
	}

    update() : Promise<(resolve, reject)=>{}>
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
		return this.execute(stmt, [vals, this.fValues['id']]);
	}


	deleteById() : Promise<(resolve, reject)=>{}>
	{
		var stmt = ['delete from', this.tablename, 'where id = ?'].join(' ');
		return this.execute(stmt, this.fValues['id']);
	}

	deleteManyById(ids: number[]) : Promise<(resolve, reject)=>{}>
	{
		if (ids.length > 0) {

			let placeholders = [];
			ids.forEach(element => {
				placeholders.push('?')
			});

			let placeholderPart = "(" + placeholders.join(', ') + ")"

			var stmt = ['delete from', this.tablename, 'where id in', placeholderPart].join(' ');
			return this.execute(stmt, ids);
		}
		else
			return new Promise ( (resolve, reject) => {
				resolve(null)
			});
	}

	deleteByField(fieldName: string) : Promise<(resolve, reject)=>{}>
	{
		var stmt = ['delete from', this.tablename, 'where', fieldName, '= ?'].join(' ');
		return this.execute(stmt, this.fValues[fieldName]);
	}

	selectById() : Promise<(resolve, reject)=>{}>
	{
		var stmt = ['select * from', this.tablename, 'where id = ?'].join(' ');
		stmt = this.addOrderCmd(stmt)
		return this.execute(stmt, this.fValues['id']).then( result => {
			if (result instanceof Array && result.length == 1) {
				return Promise.resolve(result[0])
			}
			else
				return Promise.resolve(null)
		})
		.catch( err => Promise.reject(err) );
	}

	where(wObj) : Model
	{
		Object.assign(this.whereArr, wObj)
		return this
	}

	setLikeArray (likeArr) : Model
	{
		this.likeArr = likeArr
		return this
	}

	order(ordering) : Model
	{
		this.orderBy.push(ordering)
		return this
	}

	select() : Promise<(resolve, reject)=>{}>
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
			else {
				wclause.push( f + " = ?");
				wValues.push( this.whereArr[f]);
			}
		}

		if(wclause.length > 0)
			stmt = stmt + ' where ' + wclause.join(' and ');

		stmt = this.addOrderCmd(stmt)
		return this.execute(stmt, wValues);
	}

	addOrderCmd(stmt) {
		if (this.orderBy.length > 0)
			stmt = stmt + ' order by ' + this.orderBy.join(',');
		return stmt;
	}


	// Promise to GET all objects from DB table
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

	// Promise to GET all objects from DB table
	// indexed by PK
	public static promiseGetAll(oInstance: Model, indexBy: string = 'id', isArrayMember:boolean = false) {
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

	public static promiseAddAll(oInstance: Model, indexBy: string = 'id', isArrayMember: boolean = false) {
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

	public static promiseAddById(oInstance: Model, id:number, keyName: string) {
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
}
