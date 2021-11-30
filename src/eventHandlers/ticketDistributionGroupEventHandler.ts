import logger from '../logger'
import eventsWhitelist from '../eventsWhitelist'
import { publishMessage } from '../pubsub'

const getEventContentsKey = (messageValue: any, type: string): string => {
    return `${type[0].toLowerCase()}${type.slice(1)}`
}

const handleTicketDistributionGroupEvent = async (
    topic: string,
    message: any,
    messageValue: any,
): Promise<void> => {
    const { type: eventName, correlationId, timestamp } = messageValue

    if (!eventsWhitelist.includes(eventName)) {
        return
    }

    const eventContentsKey = getEventContentsKey(messageValue, eventName)
    const eventContents = messageValue[eventContentsKey]

    logger.info(`Decoded avro value for ${eventName}`, {
        eventContents,
        correlationId,
        avroValue: messageValue,
        kafkaTimestamp: new Date(parseInt(message.timestamp)).toISOString(),
    })

    // For some strange reason there are empty keys for all possible ticket distribution events in the message,
    // this removes them.
    Object.keys(messageValue).forEach((key: string) => {
        if (
            key === eventContentsKey ||
            messageValue[key] === undefined ||
            messageValue[key] === null
        ) {
            delete messageValue[key]
        }
    })

    const pubsubData = {
        timestamp,
        eventName,
        correlationId,
        event: eventContents,
    }

    await publishMessage(topic, pubsubData)
}

export default handleTicketDistributionGroupEvent
