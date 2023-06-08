import winston from 'winston'
import { LoggingWinston } from '@google-cloud/logging-winston'

// StackDriver logger levels
// https://github.com/googleapis/nodejs-logging-winston/blob/afde0075e506fd38f9afee29a5277afa1f40a8b0/src/common.ts#L56
const LEVELS = {
    emergency: 0,
    alert: 1,
    critical: 2,
    error: 3,
    warning: 4,
    notice: 5,
    info: 6,
    debug: 7,
}

const loggingWinston = new LoggingWinston({
    levels: LEVELS,
})

const transportsDev = [new winston.transports.Console()]
const transportsProd = [loggingWinston]

export const transports = process.env.NODE_ENV === 'production' ? transportsProd : transportsDev

const logger = winston.createLogger({
    level: 'debug',
    levels: LEVELS,
    transports,
})

export default logger
