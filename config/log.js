/**
 * Created by sky on 2017/9/15.
 */
export default  {
    masterLog:{
        server: { type: 'multiprocess', mode: 'master', appender: 'file', loggerHost: '0.0.0.0', loggerPort:13112},
        appenders:{
            dateDebugFile: {
                type: 'file',
                filename: 'log/debug.log',
                maxLogSize: 500 * 1024 * 1024, // = 10Mb
                numBackups: 2, // keep five backup files
                compress: true, // compress the backups
                encoding: 'utf-8',
                flags: 'w+',
                level:'debug',
            },
            dateInfoFile: {
                type: 'dateFile',
                filename: "log/info.log",
                daysToKeep:15,
                level:'info',
            },
            dateErrorFile: {
                type: 'dateFile',
                filename: "log/error.log",
                daysToKeep:15,
                level:'info',
            },
            infoLogs:{
                type: 'logLevelFilter', appender: 'dateInfoFile', level: 'info'
            },
            errorLogs:{
                type: 'logLevelFilter', appender: 'dateErrorFile', level: 'error'
            },
            debugLogs:{
                type: 'logLevelFilter', appender: 'dateDebugFile', level: 'debug'
            },
        },
        categories: {
            default: { appenders: ['debugLogs','infoLogs','errorLogs'], level: 'trace' },
        }
    },
    workerLog:{
        appenders: {
            network: { type: 'multiprocess', mode: 'worker', loggerHost: 'localhost', loggerPort:13112}
        },
        categories: {
            default: { appenders: ['network'], level: 'trace' }
        }
    }

}