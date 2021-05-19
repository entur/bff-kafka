import { getSecret } from './secrets'
import { Consumer, Kafka, KafkaMessage } from 'kafkajs'
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry'
import { ENVIRONMENT, KAFKA_BROKER, KAFKA_SCHEMA_REGISTRY } from './config'
import { publishMessage } from './pubsub'
import logger from './logger'

let kafka: Kafka | undefined

const getKafka = async (): Promise<Kafka> => {
    if (!kafka) {
        const [username, password] = await Promise.all([
            getSecret('kafka-user'),
            getSecret('kafka-password'),
        ])

        const broker = KAFKA_BROKER || ''
        const clientId = `bff-kafka-client-${ENVIRONMENT}`
        logger.info(`Connecting to kafka broker ${broker} with clientId ${clientId}`)
        kafka = new Kafka({
            clientId,
            brokers: [broker],
            ssl: true,
            sasl: {
                mechanism: 'scram-sha-512',
                username,
                password,
            },
        })
    }
    return kafka
}

// Since we use AVRO, we need to configure a Schema Registry
// which keeps track of the schema
const registry = new SchemaRegistry({
    host: KAFKA_SCHEMA_REGISTRY || '',
})

let consumer: Consumer | undefined

export const connectToKafka = async (): Promise<void> => {
    consumer = (await getKafka()).consumer({ groupId: `bff-kafka-${ENVIRONMENT}` })
}

export const proxyToPubSub = async (topic: string): Promise<void> => {
    if (!consumer) {
        throw Error(`Cannot subscribe to Kafka topic ${topic}, consumer is undefined`)
    }
    try {
        logger.info(`Trying to subscribe to Kafka topic ${topic}`)
        await consumer.subscribe({ topic })
        logger.info(`Subscribed to Kafka topic ${topic}`)
        await consumer.run({
            autoCommit: true,
            eachMessage: async ({
                message,
            }: {
                topic: string
                partition: number
                message: KafkaMessage
            }) => {
                logger.info(`Got kafka event`)
                if (message.value) {
                    const value = await registry.decode(message.value)
                    logger.info(`Decoded avro value is ${value}`)
                    const eventName = value.eventName

                    const event = value.event

                    // In reality only one value should be found - the java class name of the event (?),
                    // but we can't know for sure what that name is.
                    let flatEvent: Record<string, any> = {}
                    Object.values(event).forEach((eventValue) => {
                        if (eventValue instanceof Object) {
                            flatEvent = {
                                ...flatEvent,
                                ...eventValue,
                            }
                        }
                    })

                    const pos = flatEvent.meta?.pos

                    if (pos === 'Entur App' || pos === 'Entur Web') {
                        value.event = flatEvent
                        await publishMessage(value, eventName)
                    } else {
                        logger.info(`Did not forward message as it was not for app/web`, {
                            correlationId: value.correlationId,
                        })
                    }
                }
            },
        })
    } catch (err) {
        logger.error(`Failed to consume ${topic}`, err)
    }
}
