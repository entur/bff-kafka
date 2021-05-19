// The tracer must be the first import in order to track time to import the other stuff
import './tracer'

import logger from './logger'

import { KAFKA_TOPICS } from './config'
import { connectToKafka, proxyToPubSub } from './kafka'
import { ENVIRONMENT } from './config'
import http from './http'

logger.info(`Starting kafka to pub sub bridge, env is ${ENVIRONMENT}.`)

http()

connectToKafka()
    .then(() => {
        KAFKA_TOPICS.split(',')
            .map((topic) => topic.trim())
            .forEach((topic) => {
                proxyToPubSub(topic)
                    .then(() => logger.info(`Consumption of ${topic} ended.`))
                    .catch((reason) =>
                        logger.error('Kafka failed, giving you up. Sorry, Rick Astley. ', reason),
                    )
            })
    })
    .catch((reason) => {
        logger.error('Could not connect to Kafka. ', reason)
    })
