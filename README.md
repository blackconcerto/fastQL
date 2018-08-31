# fastQL
a configurable api framework to build up a data querying, saving and processing based koa

## How to use
1. add config in config/
```js
//api host config in index.js
api : {
		topic : 'http://127.0.0.1:8080',
		default:'http://127.0.0.1',
	},

//db connection config in index.js
    topicMysql :{
		client: 'mysql',
		connection: {
			host:'',
			port:'',
			user:'root',
			password:"",
			database:"",
			charset  : 'utf8mb4',
			timezone: 'UTC',
			typeCast: function (field, next) {
				if (field.type == 'DATETIME' || field.type == 'DATE') {
					return moment(field.string()).format('YYYY-MM-DD HH:mm:ss');
				}
				return next();
			}
		},
		pool: {
			min: 5,
			max: 20
		}
	},

	articleMongo:{
		client: 'mongo',
		connection: {
			host:'',
			port:'27017',
			user:'',
			password:"",
			database:"",
		},
	}

	//http connect config in index.js
      port: 8000,
      namespace:'/fastQL',
```

2. add config to build base query service in business
```js
// api for url'/fastQL/sample', in business/sample.js
export default [
	{
		target:'/topic/list',                   // query api out site
		param:['type'],                         // query api parameter
		handler:async function(ctx, httpReq) { // handle query result
			let ret = await httpReq();
			logger.debug('-------------', ret)
		}
	},
]
```

database connection
```js
// api for url'/fastQL/sample', in business/sample.js
{
    mongo:'add',                  // database client type: mysql, mongo etc
    param:['content'],          // to query param name, mapping the param from client
    collection:'topic',         //  mongo:collection name, mysql: dbname
    db:"dbname",                // dbname
    handler: async function(ctx, sqlReq){
            let ret = await sqlReq();   // handle the result
    }
}
```


3. run in root folder, node server_run.js, to see http://127.0.0.1:8000/fastQL/sample in browser.