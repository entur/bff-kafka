import logger from '../logger.js'
import { publishMessage } from '../pubsub.js'
import eventsWhitelist from '../eventsWhitelist.js'
import { removeEventNameLevelFromEvent, isForSelfService } from './utils.js'

const handleOrderEvent = async (topic: string, message: any, messageValue: any): Promise<void> => {
    const { type: eventName, event, correlationId, timestamp } = messageValue

    if (!eventsWhitelist.includes(eventName)) {
        return
    }

    const eventContents = removeEventNameLevelFromEvent(event)

    if (isForSelfService(eventContents)) {
        logger.info(`Decoded avro value for ${eventName}`, {
            ...eventContents,
            correlationId,
            avroValue: messageValue,
            kafkaTimestamp: new Date(parseInt(message.timestamp)).toISOString(),
        })

        const pubsubMessage = {
            timestamp,
            eventName,
            correlationId,
            event: eventContents,
        }

        await publishMessage(topic, pubsubMessage)
    } else {
        logger.debug('Did not forward message as it was not for app/web', {
            eventName,
            correlationId,
            avroValue: messageValue,
        })
    }
}

export default handleOrderEvent
