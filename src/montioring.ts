const threshold = 3 * 60 * 1000
let lastHeartbeat = Date.now()
export const updateLastHeartbeat = (): void => {
    lastHeartbeat = Date.now()
}

export const isHeartBeating = (): boolean => Date.now() - lastHeartbeat < threshold

export const getLastHeartbeatString = (): string => new Date(lastHeartbeat).toISOString()
