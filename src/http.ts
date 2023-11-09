import http, { IncomingMessage, ServerResponse } from 'http'
import logger from './logger.js'
import { getLastHeartbeatString, isHeartBeating } from './monitoring.js'

/**
 * Minimal HTTP server that accepts any calls, used for keepalive, to prevent idle timeouts, and
 * for monitoring
 */
const httpServer = http.createServer((request: IncomingMessage, response: ServerResponse) => {
    if (request.url?.includes('heartbeat')) {
        response.setHeader('Content-Type', 'text/html')

        logger.debug('Heart beat endpoint called', { lastHeartbeat: getLastHeartbeatString() })
        if (isHeartBeating()) {
            response.writeHead(200)
            response.end(
                `Kafka consumer heart is beating, last time was ${getLastHeartbeatString()}`,
            )
        } else {
            response.writeHead(503)
            response.end(
                `Kafka consumer seems dead. Last heartbeat was at ${getLastHeartbeatString()}`,
            )
        }
    } else {
        response.setHeader('Content-Type', 'text/html')
        response.writeHead(200)
        response.end('pong')
    }
})

export default (port = process.env.PORT || 80): void => {
    logger.info(`Starting http server`)
    httpServer.listen(port, () => {
        logger.info(`Server is running on port ${port}`)
    })
}
