// The tracer must be the first import in order to track time to import the other stuff
import './tracer.js'

import logger from './logger.js'

import { KAFKA_TOPICS } from './config.js'
import { connectToKafka, proxyToPubSub } from './kafka.js'
import { ENVIRONMENT } from './config.js'
import http from './http.js'
import { updateLastHeartbeat } from './monitoring.js'

logger.info(`Starting kafka to pub sub bridge, env is ${ENVIRONMENT}.`)

// This adds a keepalive endpoint to prevent GCP from killing the app.
http()

const { consumer, registry } = await connectToKafka()

const topics = KAFKA_TOPICS.split(',').map((topic) => topic.trim())
try {
    consumer.on('consumer.crash', () => {
        logger.error('Oh damn, the Kafka consumer crashed!')
    })
    consumer.on('consumer.heartbeat', () => {
        updateLastHeartbeat()
    })
    await proxyToPubSub(consumer, registry, topics)
    logger.info(`The consumer is listening.`)
} catch (err) {
    logger.error('Kafka failed.', err)
}
