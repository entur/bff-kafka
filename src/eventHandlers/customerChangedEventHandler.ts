import { v4 as uuid } from 'uuid'

import logger from '../logger.js'
import { publishMessage } from '../pubsub.js'

interface CustomerChangedEvent {
    changeEvent: 'CREATE' | 'UPDATE' | 'DELETE'
    changedBy: string
    customerNumber: string
    customerRef: string
    mergedIntoCustomerNumber: number
    processorOrganisation: number
    profileType: 'S' | 'T' | 'P'
    timestamp: string
}

async function handleCustomerChangedEvent(
    topic: string,
    message: any,
    messageValue: CustomerChangedEvent,
): Promise<void> {
    const { changeEvent, timestamp, processorOrganisation } = messageValue

    const correlationId: string = message.headers?.['X-Correlation-Id']?.toString() || uuid()

    if (processorOrganisation !== 1) {
        logger.debug('Did not forward message as it was not processed by the Entur organization', {
            correlationId,
            avroValue: messageValue,
        })
        return
    }

    logger.info(`Decoded avro value for ${changeEvent}`, {
        ...messageValue,
        correlationId,
        avroValue: messageValue,
        kafkaTimestamp: new Date(parseInt(message.timestamp)).toISOString(),
    })

    const pubsubMessage = {
        timestamp,
        eventName: changeEvent.toLowerCase(),
        correlationId,
        event: messageValue,
    }

    await publishMessage(topic, pubsubMessage)
}

export default handleCustomerChangedEvent
