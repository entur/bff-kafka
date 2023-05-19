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
    .then(({ consumer, registry }) => {
        const topics = KAFKA_TOPICS.split(',').map((topic) => topic.trim())
        proxyToPubSub(consumer, registry, topics)
            .then(() => logger.info(`The consumer is listening.`))
            .catch((reason) => logger.error('Kafka failed.', reason))
    })
    .catch((reason) => {
        logger.error('Could not connect to Kafka. ', reason)
    })
