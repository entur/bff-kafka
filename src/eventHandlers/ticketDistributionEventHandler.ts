import logger from '../logger'
import eventsWhitelist from '../eventsWhitelist'
import { publishMessage } from '../pubsub'
import { removeEventNameLevelFromEvent } from './utils'

const handleTicketDistributionEvent = async (
    topic: string,
    message: any,
    messageValue: any,
): Promise<void> => {
    const { type: eventName, event, correlationId, timestamp } = messageValue

    if (!eventsWhitelist.includes(eventName)) {
        return
    }

    const eventContents = removeEventNameLevelFromEvent(event)

    logger.info(`Decoded avro value for ${eventName}`, {
        ...eventContents,
        correlationId,
        avroValue: messageValue,
        kafkaTimestamp: new Date(parseInt(message.timestamp)).toISOString(),
    })

    const pubsubData = {
        timestamp,
        eventName,
        correlationId,
        event: eventContents,
    }

    await publishMessage(topic, pubsubData)
}

export default handleTicketDistributionEvent
