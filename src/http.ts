import http, { IncomingMessage, ServerResponse } from 'http'
import logger from './logger.js'
import { getLastHeartbeatString, isHeartBeating } from './montioring.js'

/**
 * Minimal HTTP server that accepts any calls, used for keepalive, to prevent idle timeouts, and
 * for monitoring
 */
const httpServer = http.createServer((request: IncomingMessage, response: ServerResponse) => {
    if (request.url?.includes('heartbeat')) {
        response.setHeader('Content-Type', 'text/html')

        if (isHeartBeating()) {
            const message = `Kafka consumer heart is beating, last time was ${getLastHeartbeatString()}`
            response.writeHead(200)
            logger.debug(message)
            response.end(message)
        } else {
            const message = `Kafka consumer seems dead. Last heartbeat was at ${getLastHeartbeatString()}`
            logger.error(message)
            response.writeHead(503)
            response.end(message)
        }
    } else {
        logger.debug(`Received http request to ${request.url}`)
        response.setHeader('Content-Type', 'text/html')
        response.writeHead(100)
        response.end('pong')
    }
})

export default (port = process.env.PORT || 80): void => {
    logger.info(`Starting http server`)
    httpServer.listen(port, () => {
        logger.info(`Server is running on port ${port}`)
    })
}
