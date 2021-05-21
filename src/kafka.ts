import { getSecret } from './secrets'
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs'
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
        logger.info(`Connected to kafka broker ${broker} with clientId ${clientId}`)
    }
    return kafka
}

export const connectToKafka = async (): Promise<void> => {
    const groupId = `bff-kafka-${ENVIRONMENT}`
    consumer = (await getKafka()).consumer({ groupId })
    logger.info(`Registered consumer with groupId ${groupId}`)
}

// Since we use AVRO, we need to configure a Schema Registry
// which keeps track of the schema
const registry = new SchemaRegistry({
    host: KAFKA_SCHEMA_REGISTRY || '',
})

let consumer: Consumer | undefined

const getEventContents = (event: any): Record<string, any> => {
    let flatEvent: Record<string, any> = {}

    // The event field of the Kafka message contains a single key - the java class name of the event (?).
    // We can't know for sure what that key is so we loop over any values (though there should in reality only
    // be a single entry)
    Object.values(event)?.forEach((eventValue) => {
        if (eventValue instanceof Object) {
            flatEvent = {
                ...flatEvent,
                ...eventValue,
            }
        }
    })

    return flatEvent
}

const messageHandler = async ({ message }: EachMessagePayload): Promise<void> => {
    logger.debug(`Got kafka event`)

    if (message.value) {
        const messageValue = await registry.decode(message.value)
        const { eventName, event, correlationId } = messageValue

        const eventContents = getEventContents(event)
        const pos = eventContents.meta?.pos

        if (pos === 'Entur App' || pos === 'Entur Web') {
            logger.info(
                `Decoded avro value for ${eventName} (paymentId ${eventContents.paymentId})`,
                {
                    correlationId,
                    paymentId: eventContents.paymentId,
                    avroValue: messageValue,
                    kafkaTimestamp: new Date(parseInt(message.timestamp)),
                },
            )

            // construct a copy of the message value object but without the java-class-name key in the event.
            const valueWithoutEventName = {
                ...messageValue,
                event: eventContents,
            }

            await publishMessage(valueWithoutEventName, eventName, correlationId)
        } else {
            logger.debug(`Decoded avro value for ${eventName}`, {
                correlationId,
                avroValue: messageValue,
            })
            logger.debug('Did not forward message as it was not for app/web', {
                correlationId: messageValue.correlationId,
            })
        }
    }
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
            eachMessage: messageHandler,
        })
    } catch (err) {
        logger.error(`Failed to consume ${topic}`, err)
    }
}
