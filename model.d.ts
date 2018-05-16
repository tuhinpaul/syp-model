declare module 'model' {
	export default class Model {
	    private className;
	    tablename: string;
	    fields: string[];
	    fValues: {};
	    private whereArr;
	    private likeArr;
	    private orderBy;
	    private static connConf;
	    private static modelConf;
	    static config(connConf: any, modelConf: any): void;
	    protected constructor();
	    private initialize();
	    static factory(className: string): Model;
	    static emptyModel(): Model;
	    assign(property: string, value: any): Model;
	    assignAll(properties: Object): Model;
	    valueOf(property: string): any;
	    static execute(stmt: String, params: any | any[]): Promise<(resolve, reject) => {}>;
	    create(): Promise<(resolve, reject) => {}>;
	    update(): Promise<(resolve, reject) => {}>;
	    deleteById(): Promise<(resolve, reject) => {}>;
	    deleteManyById(ids: number[]): Promise<(resolve, reject) => {}>;
	    /**
	     * Deletes records based on the column name provided as argument.
	     *
	     * @param fieldName the name of the column which is used in the where clause of delete query.
	     * The table name and column value to use for deletion will be taken from the invoking object.
	     *
	     * @return promise that resolves to the result of the delete query.
	     */
	    deleteByField(fieldName: string): Promise<(resolve, reject) => {}>;
	    /**
	     * Returns the object that matches the ID of the invoking model
	     *
	     * @return a promise that resolves to the the object which matches the id of the invoking model. If no record is found, the promise resolves to null.
	     */
	    selectById(): Promise<(resolve, reject) => {}>;
	    where(wObj: any): Model;
	    setLikeArray(likeArr: any): Model;
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
	    order(ordering: string | string[] | Object): Model;
	    /**
	     * Finds records from the database
	     *
	     * @return a promise that resolves to the returned records
	     */
	    select(): Promise<(resolve, reject) => {}>;
	    addOrderCmd(stmt: any): any;
	    /**
	     * Insert more than one record
	     * valueArr: should be a 2D array of values for the columns
	     */
	    static insertMany(modelName: any, columns: any, valueArr: any): Promise<(resolve: any, reject: any) => {}>;
	    /**
	     * Promise to GET the first matching object from DB table
	     */
	    static promiseGetOne(oInstance: Model, keyName: string): Promise<{}>;
	    /**
	     * Promise to GET all objects from DB table
	     * indexed by PK by defaule
	     *
	     * @param modelNameOrInstance can be either a model name or model instance. If it's a model name, an instance is created using Model.factory()
	     * @param indexBy how to index the objects in the returned list of objects
	     * @param isArrayMember is an index can be associated with multiple objects
	     */
	    static promiseGetAll(modelNameOrInstance: String | Model, indexBy?: string, isArrayMember?: boolean): Promise<{}>;
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
	    static promiseAddAll(modelNameOrInstance: String | Model, indexBy?: string, isArrayMember?: boolean): ((pool: any) => Promise<any>);
	    static promiseAddById(modelNameOrInstance: String | Model, id: number, keyName: string): (pool: any) => Promise<{}>;
	    static promiseAddOne(oInstance: Model, keyName: string): (pool: any) => Promise<{}>;
	    private isString(value);
	    private isArray(value);
	    private isObject(value);
	}

}
