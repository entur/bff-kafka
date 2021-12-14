export type EventContents = Record<string, any>

export interface PubsubMessage {
    timestamp: string
    eventName: string
    correlationId?: string
    event: EventContents
}
