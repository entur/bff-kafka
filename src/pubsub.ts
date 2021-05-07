import { PubSub } from '@google-cloud/pubsub'
import logger from './logger'
import { PUBSUB_TOPIC } from './config'

// Creates a client; cache this for further use
const pubSubClient = new PubSub()

export async function publishMessage(data: any, eventName: string) {
    // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
    const dataBuffer = Buffer.from(JSON.stringify(data))
    const customAttributes = { eventName }

    try {
        const messageId = await pubSubClient
            .topic(PUBSUB_TOPIC)
            .publish(dataBuffer, customAttributes)
        logger.info(`Published ${eventName} with id ${messageId} to Pub/Sub topic ${PUBSUB_TOPIC}`)
    } catch (error) {
        logger.error(`Received error while publishing: ${error.message}`)
        process.exitCode = 1
    }
}
