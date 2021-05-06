import { PubSub } from '@google-cloud/pubsub'

const topicName = 'bff-kafka-event'

// Creates a client; cache this for further use
const pubSubClient = new PubSub()

export async function publishMessage(data: any) {
    // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
    const dataBuffer = Buffer.from(JSON.stringify(data))

    try {
        const messageId = await pubSubClient.topic(topicName).publish(dataBuffer)
        console.log(`Message ${messageId} published.`)
    } catch (error) {
        console.error(`Received error while publishing: ${error.message}`)
        process.exitCode = 1
    }
}
