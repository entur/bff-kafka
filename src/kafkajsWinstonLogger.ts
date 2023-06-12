import { logCreator, LogEntry, logLevel } from 'kafkajs'
import winston from 'winston'
import { transports } from './logger.js'

const mapKafkajsLogLevelToWinstonLogLevel = (level: logLevel): string => {
    switch (level) {
        case logLevel.ERROR:
        case logLevel.NOTHING:
            return 'error'
        case logLevel.WARN:
            return 'warn'
        case logLevel.INFO:
            return 'info'
        case logLevel.DEBUG:
            return 'debug'
    }
}

export const WinstonLogCreator: logCreator = (minLogLevel: logLevel) => {
    const logger = winston.createLogger({
        level: mapKafkajsLogLevelToWinstonLogLevel(minLogLevel),
        transports,
    })

    return ({ level, log }: LogEntry) => {
        const { message, ...extra } = log
        logger.log({
            level: mapKafkajsLogLevelToWinstonLogLevel(level),
            message,
            extra,
        })
    }
}
