import { PubSub } from '@google-cloud/pubsub'
import logger from './logger'
import { PUBSUB_TOPIC } from './config'
import { Meta } from './types'

const pubSubClient = new PubSub()

export async function publishMessage(
    data: Record<string, unknown>,
    eventName: string,
    meta: Meta,
): Promise<void> {
    const dataBuffer = Buffer.from(JSON.stringify(data))
    const customAttributes = { eventName }

    try {
        const messageId = await pubSubClient
            .topic(PUBSUB_TOPIC)
            .publish(dataBuffer, customAttributes)
        logger.info(
            `Published ${eventName} with message id ${messageId} to Pub/Sub topic ${PUBSUB_TOPIC}`,
            meta,
        )
    } catch (error) {
        logger.error(`Received error while publishing: ${error.message}`, meta)
        throw error
    }
}
