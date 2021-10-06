import { getSecret } from './secrets'
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs'
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry'
import {
    ENTUR_POS_NATIVE,
    ENTUR_POS_WEB,
    ENVIRONMENT,
    KAFKA_BROKER,
    KAFKA_SCHEMA_REGISTRY,
} from './config'
import { publishMessage } from './pubsub'
import logger from './logger'
import eventsWhitelist from './eventsWhitelist'

let kafka: Kafka | undefined

type EventContents = Record<string, any>

// having a local part of the id lets us run against other environments
// from localhost without interfering with the real bff-kafka instances
const localId = process.env.NODE_ENV === 'production' ? '' : '-local'

const getKafka = async (): Promise<Kafka> => {
    if (!kafka) {
        const [username, password] = await Promise.all([
            getSecret('kafka-user'),
            getSecret('kafka-password'),
        ])

        const broker = KAFKA_BROKER || ''
        const clientId = `bff-kafka-client-${ENVIRONMENT}${localId}`
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
    const groupId = `bff-kafka-${ENVIRONMENT}${localId}`
    consumer = (await getKafka()).consumer({ groupId })
    logger.info(`Registered consumer with groupId ${groupId}`)
}

// Since we use AVRO, we need to configure a Schema Registry
// which keeps track of the schema
const registry = new SchemaRegistry({
    host: KAFKA_SCHEMA_REGISTRY || '',
})

let consumer: Consumer | undefined

const getEventContents = (event: any): EventContents => {
    let flatEvent: EventContents = {}

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

const isForSelfService = (eventContents: any): boolean => {
    const pos = eventContents.meta?.pos

    return (
        pos === ENTUR_POS_NATIVE || pos === ENTUR_POS_WEB || pos === 'sales-process-manager-client'
    )
}

const handleEvent = async (topic: string, message: any, messageValue: any): Promise<void> => {
    const { eventName, event, correlationId } = messageValue

    const eventContents = getEventContents(event)

    logger.info(`Decoded avro value for ${eventName}`, {
        ...eventContents,
        correlationId,
        avroValue: messageValue,
        kafkaTimestamp: new Date(parseInt(message.timestamp)).toISOString(),
    })

    // construct a copy of the message value object but without the java-class-name key in the event.
    const eventData = {
        ...messageValue,
        event: eventContents,
    }

    await publishMessage(topic, eventName, eventData, correlationId)
}

const handlePaymentEvent = async (
    topic: string,
    message: any,
    messageValue: any,
): Promise<void> => {
    const { eventName, event, correlationId } = messageValue
    const eventContents = getEventContents(event)

    if (isForSelfService(eventContents)) {
        await handleEvent(topic, message, messageValue)
    } else {
        logger.debug('Did not forward message as it was not for app/web', {
            eventName,
            correlationId,
            avroValue: messageValue,
        })
    }
}

const messageHandler = async ({ message, topic }: EachMessagePayload): Promise<void> => {
    if (message.value) {
        const messageValue = await registry.decode(message.value)
        const { eventName } = messageValue

        if (!eventsWhitelist.includes(eventName)) {
            return
        }

        logger.debug(`Got kafka event on topic ${topic}`)
        if (topic.startsWith('payment-events')) {
            await handlePaymentEvent(topic, message, messageValue)
        } else {
            await handleEvent(topic, message, messageValue)
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
