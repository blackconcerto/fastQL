/**
 * Created by sky on 2017/11/22.
 */
import moment from 'moment'

export default {
	defaultDb:'chatroom',
	chatroomMysql :{
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
}