const MINUTE = 60000
const threshold = 3 * MINUTE
let lastHeartbeat = Date.now()
export const updateLastHeartbeat = (): void => {
    lastHeartbeat = Date.now()
}

export const isHeartBeating = (): boolean => Date.now() - lastHeartbeat < threshold

export const getLastHeartbeatString = (): string => new Date(lastHeartbeat).toISOString()
