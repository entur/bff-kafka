// types for Snappy are missing, but we don't need them
// @ts-ignore
import SnappyCodec from 'kafkajs-snappy'
import kafkaJsLZ4 from 'kafkajs-lz4'
import { Kafka, CompressionTypes, CompressionCodecs } from 'kafkajs'
import type { EachMessagePayload, Consumer } from 'kafkajs'
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry'

import handleTicketDistributionGroupEvent from './eventHandlers/ticketDistributionGroupEventHandler.js'
import handleCustomerChangedEvent from './eventHandlers/customerChangedEventHandler.js'
import handlePaymentEvent from './eventHandlers/paymentEventHandler.js'

import { ENVIRONMENT, KAFKA_BROKER, KAFKA_SCHEMA_REGISTRY } from './config.js'
import { WinstonLogCreator } from './kafkajsWinstonLogger.js'
import { getSecret } from './secrets.js'
import logger from './logger.js'

// Yeah, this doesn't look good. It tries to resolve a CommonJS vs ES Modules error
// that leads to a "TS2351: This expression is not constructable" error when doing
// new LZ4Codec() if it is imported directly.
// (See https://github.com/ajv-validator/ajv/issues/2132#issuecomment-1290409907)
const LZ4Codec = kafkaJsLZ4.default

// Kafkajs supports Gzip compression by default. LZ4-support is needed because
// some of the producers suddenly started publishing LZ4-compressed messages.
// Snappy is included because it seems fairly popular, and we want to prevent a
// future crash like the one we got from LZ4.
CompressionCodecs[CompressionTypes.LZ4] = new LZ4Codec().codec
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec

// having a local part of the id lets us run against other environments
// from localhost without interfering with the real bff-kafka instances
const localId = process.env.NODE_ENV === 'production' ? '' : '-local'

export const connectToKafka = async (): Promise<{
    consumer: Consumer
    registry: SchemaRegistry
}> => {
    const [username, password] = await Promise.all([
        getSecret('kafka-user-aiven'),
        getSecret('kafka-password-aiven'),
    ])

    // kafka works as a message queue if multiple consumers share group id, meaning only one consumer will
    // get a messsage. To prevent local runs interfering with production we add a localId.
    const groupId = `bff-kafka-${ENVIRONMENT}${localId}`
    const consumer = (await getKafka(username, password)).consumer({ groupId })
    const registry = getRegistry(username, password)

    logger.info(`Registered consumer with groupId ${groupId}`)

    return { consumer, registry }
}

const getKafka = async (username: string, password: string): Promise<Kafka> => {
    const broker = KAFKA_BROKER || ''
    const clientId = `bff-kafka-client-${ENVIRONMENT}${localId}` // unique pr client
    const kafka = new Kafka({
        clientId,
        logCreator: WinstonLogCreator,
        brokers: [broker],
        ssl: true,
        sasl: {
            mechanism: 'scram-sha-512',
            username,
            password,
        },
    })
    logger.info(
        `Connected to kafka broker ${broker} with clientId ${clientId} and user ${username}`,
    )
    return kafka
}

// Since we use AVRO, we need to configure a Schema Registry
// which keeps track of the schema
const getRegistry = (username: string, password: string): SchemaRegistry => {
    return new SchemaRegistry({
        host: KAFKA_SCHEMA_REGISTRY || '',
        auth: {
            username,
            password,
        },
    })
}

const messageHandler =
    (registry: SchemaRegistry) =>
    async ({ message, topic }: EachMessagePayload): Promise<void> => {
        logger.debug(`Got kafka event on topic ${topic}`)

        if (!message.value) {
            return
        }

        const messageValue = await registry.decode(message.value)
        if (topic.startsWith('payment-events')) {
            await handlePaymentEvent(topic, message, messageValue)
        } else if (topic.startsWith('ticket-distribution-group-events')) {
            await handleTicketDistributionGroupEvent(topic, message, messageValue)
        } else if (topic.startsWith('customer-changed')) {
            await handleCustomerChangedEvent(topic, message, messageValue)
        }
    }

export const proxyToPubSub = async (
    consumer: Consumer,
    registry: SchemaRegistry,
    topics: string[],
): Promise<void> => {
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
            eachMessage: messageHandler(registry),
        })
    } catch (err) {
        logger.error('Failed to run consumer', err)
    }
}
