import logger from './logger.js'

const MINUTE = 60000
const threshold = 3 * MINUTE
let lastHeartbeat = Date.now()
export const updateLastHeartbeat = (): void => {
    lastHeartbeat = Date.now()
    logger.debug('consumer.heartbeat received', { lastHeartbeat })
}

export const isHeartBeating = (): boolean => Date.now() - lastHeartbeat < threshold

export const getLastHeartbeatString = (): string => new Date(lastHeartbeat).toISOString()
