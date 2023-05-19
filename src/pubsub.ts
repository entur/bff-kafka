import { PubSub } from '@google-cloud/pubsub'
import logger from './logger.js'
import { PubsubMessage } from './types.js'

const pubSubClient = new PubSub()

const getKafkaTopicWithoutEnv = (kafkaTopic: string): string => {
    if (
        kafkaTopic.endsWith('-production') ||
        kafkaTopic.endsWith('-staging') ||
        kafkaTopic.endsWith('-dev')
    ) {
        return kafkaTopic.substr(0, kafkaTopic.lastIndexOf('-'))
    }
    return kafkaTopic
}

export async function publishMessage(kafkaTopic: string, message: PubsubMessage): Promise<void> {
    const { eventName, correlationId } = message
    const data = Buffer.from(JSON.stringify(message))
    const topic = `bff-kafka-${getKafkaTopicWithoutEnv(kafkaTopic)}`
    try {
        const messageId = await pubSubClient.topic(topic).publish(data, { eventName })
        logger.info(
            `Published ${eventName} with message id ${messageId} to Pub/Sub topic ${topic}`,
            { correlationId, eventName, topic },
        )
    } catch (error) {
        logger.error(`Received error while publishing: ${error}`, { correlationId })
        throw error
    }
}
