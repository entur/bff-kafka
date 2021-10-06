import { PubSub } from '@google-cloud/pubsub'
import logger from './logger'

const pubSubClient = new PubSub()

const getPubsubTopic = (kafkaTopic: string): string => {
    if (
        kafkaTopic.endsWith('-production') ||
        kafkaTopic.endsWith('-staging') ||
        kafkaTopic.endsWith('-dev')
    ) {
        return kafkaTopic.substr(0, kafkaTopic.lastIndexOf('-'))
    }
    return kafkaTopic
}

export async function publishMessage(
    kafkaTopic: string,
    eventName: string,
    data: Record<string, unknown>,
    correlationId: string,
): Promise<void> {
    const dataBuffer = Buffer.from(JSON.stringify(data))
    const topic = `bff-kafka-${getPubsubTopic(kafkaTopic)}`
    try {
        const messageId = await pubSubClient.topic(topic).publish(dataBuffer, { eventName })
        logger.info(
            `Published ${eventName} with message id ${messageId} to Pub/Sub topic ${topic}`,
            { correlationId, eventName, topic },
        )
    } catch (error) {
        logger.error(`Received error while publishing: ${error}`, { correlationId })
        throw error
    }
}
