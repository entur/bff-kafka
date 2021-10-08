import { EventContents } from '../types'

export const removeEventNameLevelFromEvent = (event: any): EventContents => {
    // The event field of the Kafka message contains a single key - the java class name of the event (?).
    // We can't know for sure what that key is so we loop over any values (though there should in reality only
    // be a single entry)
    return Object.values(event)?.reduce((flattenedEvent: EventContents, value) => {
        if (value instanceof Object) {
            return {
                ...flattenedEvent,
                ...value,
            }
        }
        return flattenedEvent
    }, {})
}
