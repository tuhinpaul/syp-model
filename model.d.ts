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
	    deleteByField(fieldName: string): Promise<(resolve, reject) => {}>;
	    selectById(): Promise<(resolve, reject) => {}>;
	    where(wObj: any): Model;
	    setLikeArray(likeArr: any): Model;
	    order(ordering: string | string[] | Object): Model;
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
	    static promiseAddById(oInstance: Model, id: number, keyName: string): (pool: any) => Promise<{}>;
	    static promiseAddOne(oInstance: Model, keyName: string): (pool: any) => Promise<{}>;
	    private isString(value);
	    private isArray(value);
	    private isObject(value);
	}

}
