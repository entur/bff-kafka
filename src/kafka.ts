import { getKafkaPassword, KAFKA_USER } from './secrets'
import { Kafka, KafkaMessage } from 'kafkajs'
import {
    SchemaRegistry,
} from "@kafkajs/confluent-schema-registry";

let kafka: Kafka | undefined;

// Create the client with the broker list
const getKafka = async () => {
    if(!kafka) {
        kafka = new Kafka({
            clientId: 'bff-kafka-client',
            brokers: ['bootstrap.test-int.kafka.entur.io:9095'],
            ssl: true,
            sasl: {
                mechanism: 'scram-sha-512',
                username: KAFKA_USER,
                password: await getKafkaPassword()
            },
        })
    }
    return kafka;
}

// If we use AVRO, we need to configure a Schema Registry
// which keeps track of the schema
const registry = new SchemaRegistry({
    host: "http://schema-registry.test-int.kafka.entur.io:8001",
});

const consume = async () => {
    const consumer = (await getKafka()).consumer({ groupId: 'bff-kafka' })
    try {
        await consumer.subscribe({ topic: 'payment-events-dev', fromBeginning: true })
        console.log('subscribed');
        await consumer.run({
            autoCommit: false,
            eachMessage: async ({ topic, partition, message }: {topic: string, partition: number, message: KafkaMessage}) => {
                console.log('got a message');
                if (message.value) {
                    const value = await registry.decode(message.value);
                    console.log(value);
                }
            },
        })
    } catch(err){
        console.log('Failed to consume', err)
    }

}

export default consume;

