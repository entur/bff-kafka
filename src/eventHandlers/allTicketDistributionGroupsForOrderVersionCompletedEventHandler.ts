import logger from '../logger'
import { v4 as uuid } from 'uuid'
import { publishMessage } from '../pubsub'

const handleAllTicketDistributionGroupsForOrderVersionCompletedEvent = async (
    topic: string,
    message: any,
    messageValue: any,
): Promise<void> => {
    // We only want to handle tickets created by entur
    if (messageValue.meta.organisationId !== 1) {
        return
    }

    logger.info(`Decoded avro value for AllTicketDistributionGroupsForOrderVersionCompletedEvent`, {
        avroValue: messageValue,
        kafkaTimestamp: new Date(parseInt(message.timestamp)).toISOString(),
    })

    const pubsubData = {
        eventName: 'AllTicketDistributionGroupsForOrderVersionCompleted',
        timestamp: messageValue.meta.timestamp,
        // 2022-09-01: no uuid in kafka message yet so we generate our own
        correlationId: messageValue.correlationId || uuid(),
        event: messageValue,
    }

    await publishMessage(topic, pubsubData)
}

export default handleAllTicketDistributionGroupsForOrderVersionCompletedEvent
