import http from './http'
import socket from './socket'
import constant from './constant'
import log from './log'
import db from './db'

const config = {
	http : http,
	socket : socket,
	constant:constant,
	log: log,
	logLevel:'ALL',
	db:db,
	api : {
		topic : 'http://127.0.0.1:8080',
		default:'http://127.0.0.1',
	},

}

export default config
