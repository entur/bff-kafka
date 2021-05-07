// The tracer must be the first import in order to track time to import the other stuff
import './tracer'

import logger from './logger'

import { KAFKA_TOPIC_PAYMENT } from './config'
import { connectToKafka, proxyToPubSub } from './kafka'
import { ENVIRONMENT } from './config'

logger.info(`Starting kafka to pub sub bridge, env is ${ENVIRONMENT}.`)

connectToKafka()
    .then(() => {
        proxyToPubSub(KAFKA_TOPIC_PAYMENT)
            .then(() => logger.info(`Consumption of ${KAFKA_TOPIC_PAYMENT} ended.`))
            .catch((reason) =>
                logger.error('Kafka failed, giving you up. Sorry, Rick Astley. ', reason),
            )
    })
    .catch((reason) => {
        logger.error('Could not conenct to Kafka. ', reason)
    })
