export default class Model
{
	//private className: string
	tablename : string
	fields: string[]
	fValues: Object

	//private whereArr = {}
	//private likeArr = {} // values are wildcards indicating wether/not wildcards should be applied to the corresponding value in whereArr.
	//private orderBy:string[] = []

	//private static connConf  = null
	//private static modelConf = null

	static config: (connConf: Object, modelConf: Object) => void

	constructor()

	//private initialize()

	static factory: (className: string) => Model

	static emptyModel: () => Model

	assign: (property: string, value: any) => Model

	assignAll(properties: Object): Model

	valueOf: (property: string) => any

	static execute: (stmt: String, params: any|any[]) => Promise<(resolve, reject)=>{}>

    create: () => Promise<(resolve, reject)=>{}>

    update: () => Promise<(resolve, reject)=>{}>

	deleteById: () => Promise<(resolve, reject)=>{}>

	deleteManyById: (ids: number[]) => Promise<(resolve, reject)=>{}>

	deleteByField: (fieldName: string) => Promise<(resolve, reject)=>{}>

	selectById: () => Promise<(resolve, reject)=>{}>

	where: (wObj: any) => Model

	setLikeArray: (likeArr) => Model

	order: (ordering: string | string[] | Object) => Model

	select: () => Promise<(resolve, reject)=>{}>

	addOrderCmd: (stmt: string) => string

	/**
	 * Insert more than one record
	 * valueArr: should be a 2D array of values for the columns
	 */
	static insertMany: (modelName, columns, valueArr) => Promise<any>

	/**
	 * Promise to GET all objects from DB table
	 */
	static promiseGetOne: (oInstance: Model, keyName: string) => Promise<any>

	// Promise to GET all objects from DB table
	// indexed by PK
	static promiseGetAll: (oInstance: Model, indexBy?: string, isArrayMember?:boolean) => Promise<any>

	static promiseAddAll: (oInstance: Model, indexBy?: string, isArrayMember?: boolean) => ((pool: any) => Promise<any>)

	static promiseAddById: (oInstance: Model, id:number, keyName: string) => ((pool: any) => Promise<any>)
	
	static promiseAddOne: (oInstance: Model, keyName: string) => ((pool: any) => Promise<any>)
}
