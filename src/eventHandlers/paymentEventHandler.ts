import logger from '../logger'
import { publishMessage } from '../pubsub'
import { ENTUR_POS_NATIVE, ENTUR_POS_WEB } from '../config'
import eventsWhitelist from '../eventsWhitelist'
import { removeEventNameLevelFromEvent } from './utils'

const isForSelfService = (eventContents: any): boolean => {
    const pos = eventContents.meta?.pos

    return (
        pos === ENTUR_POS_NATIVE || pos === ENTUR_POS_WEB || pos === 'sales-process-manager-client'
    )
}

const handlePaymentEvent = async (
    topic: string,
    message: any,
    messageValue: any,
): Promise<void> => {
    const { eventName, event, correlationId, timestamp } = messageValue

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

export default handlePaymentEvent
