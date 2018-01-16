# :heavy_check_mark: syp-model
###### Simple yet powerful model

Simple yet powerful promise-based database model for Node.js

Author: Tuhin Paul
:phone: [Mobile](tel:+1(306)880-5494) :email: [Email](mailto:tuhin.paul@usask.ca)

January 16, 2018

***

Before using the model, you need to provide following configurations using the static Model::config(connectionParameters, modelConf) method:

* connection parameters
* model configurations

Currently, the model works for mysql. Support for other database systems will be added soon.


Example of using static Model::config(connectionParameters, modelConf):

```javascript
/** the configuration should have an object
    named connectionParameters as follows.
    Database connection parameters are to be provided inside connectionParameters */
let dbConnConf = {
	"connectionParameters": {
		"host"               : "<mysql host>",
		"user"               : "<mysql username>",
		"password"           : "<mysql password>",
		"database"           : "<database name>",
		"multipleStatements" : true,
		"pool"               : { "maxConnections": 20, "maxIdleTime": 30}
	}
}

/** you provide the information of the models and corresponding
    tablename and column names to Model::config() method as follows.
    Suppose, following three tables exist in the database:
        users, categories, and currencies. */
let dbConf = {
	"User": {
		"tablename": "users",
		"columns": [
			"id",
			"role_id",
			"name",
			"username",
			"email",
			"password",
			"status",
			"last_login_on"
		]
	},

	"Category": {
		"tablename": "categories",
		"columns": [
			"id",
			"domain_id",
			"name",
			"parent_id",
			"description"
		]
	},

	"Currency": {
		"tablename": "currencies",
		"columns": [
			"id",
			"code",
			"name"
		]
	},
}

/* configuration information before using Model */
Model.config(dbConnConf, modelConf) {
```

After passing the configuration information, you can use the Model class as shown in the following code snippet. Note that we have a table :

```javascript
let data = {}
Model.factory('Category').select()
.then(categories => {
	data['categories'] = categories;
	return Model.factory('Currency').select()
})
.then(currencies => {
	data['currencies'] = currencies;
	
	/* debug page data */
	console.log('Page Data')
	console.log(data)

	/* render() is a custom method I wrote to render a view */
	// suppose I am using PUG (https://pugjs.org/):
	this.render('all-categories', data)
})
.catch(err => {
	/* renderError is a custom method I wrote to render error */
	this.renderError(err);
})
```
