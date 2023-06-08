// types for Snappy are missing, but we don't need them
// @ts-ignore
import SnappyCodec from 'kafkajs-snappy'
import LZ4Codec from 'kafkajs-lz4'
import { Consumer, EachMessagePayload, Kafka, CompressionTypes, CompressionCodecs } from 'kafkajs'
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry'

import { getSecret } from './secrets'
import { ENVIRONMENT, KAFKA_BROKER, KAFKA_SCHEMA_REGISTRY } from './config'
import logger from './logger'

import handleCustomerChangedEvent from './eventHandlers/customerChangedEventHandler'
import handlePaymentEvent from './eventHandlers/paymentEventHandler'
import handleTicketDistributionGroupEvent from './eventHandlers/ticketDistributionGroupEventHandler'
import handleTicketDistributionEvent from './eventHandlers/ticketDistributionEventHandler'

let kafka: Kafka | undefined

// Kafkajs supports Gzip compression by default. LZ4-support is needed because
// some of the producers suddenly started publishing LZ4-compressed messages.
// Snappy is included because it seems fairly popular and we want to prevent a
// future crash like the one we got from LZ4.
CompressionCodecs[CompressionTypes.LZ4] = new LZ4Codec().codec
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec

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
        const clientId = `bff-kafka-client-${ENVIRONMENT}${localId}` // unique pr client
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
    // kafka works as a message queue if multiple consumers share group id, meaning only one consumer will
    // get a messsage. To prevent local runs interfering with production we add a localId.
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

const messageHandler = async ({ message, topic }: EachMessagePayload): Promise<void> => {
    logger.debug(`Got kafka event on topic ${topic}`)

    if (!message.value) {
        return
    }

    const messageValue = await registry.decode(message.value)
    if (topic.startsWith('payment-events')) {
        await handlePaymentEvent(topic, message, messageValue)
    } else if (topic.startsWith('ticket-distribution-group-events')) {
        await handleTicketDistributionGroupEvent(topic, message, messageValue)
    } else if (topic.startsWith('ticket-distribution-events')) {
        await handleTicketDistributionEvent(topic, message, messageValue)
    } else if (topic.startsWith('customer-changed')) {
        await handleCustomerChangedEvent(topic, message, messageValue)
    }
}

export const proxyToPubSub = async (topics: string[]): Promise<void> => {
    if (!consumer) {
        throw Error('Cannot subscribe to topics, consumer is undefined')
    }

    // eslint-disable-next-line fp/no-loops
    for (const topic of topics) {
        try {
            logger.info(`Trying to subscribe to topic ${topic}`)
            await consumer.subscribe({ topic })
            logger.info(`Subscribed to topic ${topic}`)
        } catch (err) {
            logger.error(`Failed to subscribe to ${topic}`, err)
        }
    }

    try {
        await consumer.run({
            autoCommit: true,
            eachMessage: messageHandler,
        })
    } catch (err) {
        logger.error('Failed to run consumer', err)
    }
}
