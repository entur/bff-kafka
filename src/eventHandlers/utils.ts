import { EventContents } from '../types.js'
import { ENTUR_POS_NATIVE, ENTUR_POS_WEB } from '../config.js'

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

export const isForSelfService = (eventContents: any): boolean => {
    const pos = eventContents.meta?.pos

    return pos === ENTUR_POS_NATIVE || pos === ENTUR_POS_WEB
}
