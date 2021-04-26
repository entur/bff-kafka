import { getSecret } from './secrets'
import { Kafka, KafkaMessage } from 'kafkajs'
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry'
import { KAFKA_BROKER, KAFKA_SCHEMA_REGISTRY } from './config'

let kafka: Kafka | undefined

const getKafka = async () => {
    if (!kafka) {
        const [username, password] = await Promise.all([
            getSecret('kafka-user'),
            getSecret('kafka-password'),
        ])

        kafka = new Kafka({
            clientId: 'bff-kafka-client',
            brokers: [KAFKA_BROKER || ''],
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

const consume = async () => {
    const consumer = (await getKafka()).consumer({ groupId: 'bff-kafka' })
    try {
        await consumer.subscribe({ topic: 'payment-events-dev', fromBeginning: true })
        console.log('subscribed')
        await consumer.run({
            autoCommit: false,
            eachMessage: async ({
                message,
            }: {
                topic: string
                partition: number
                message: KafkaMessage
            }) => {
                console.log('got a message')
                if (message.value) {
                    const value = await registry.decode(message.value)
                    console.log(value)
                }
            },
        })
    } catch (err) {
        console.log('Failed to consume', err)
    }
}

export default consume
