// The tracer must be the first import in order to track time to import the other stuff
import './tracer'

import bodyParser from 'body-parser'
// import cors from 'cors'
import express from 'express'

import logger, { reqResLoggerMiddleware } from './logger'
import { NotFoundError, InvalidArgumentError } from './errors'
// import { unauthorizedError } from './auth'
import testRouter from './test'

import consume from './kafka';

const PORT = process.env.PORT || 9000
const app = express()
consume().then(() => console.log('consumed')).catch((reason) => console.log('kafka failed', reason));

app.use(
    bodyParser.json({
        limit: '10mb',
    }),
)

if (process.env.NODE_ENV === 'production') {
    app.use(reqResLoggerMiddleware)
}

// app.use(cors())

app.get('/_ah/warmup', (_req, res) => {
    logger.info('Yeah, drop to the floor and give me 50!')
    res.end()
})

app.use('/', testRouter)

app.all('*', (_, res) => {
    res.status(404).json({ error: '404 Not Ground' })
})

// app.use(unauthorizedError)

app.use(
    (
        error: Error,
        _req: express.Request,
        res: express.Response,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _2: express.NextFunction,
    ) => {
        const name = error.constructor?.name || 'Error'
        let statusCode = 500
        if (error instanceof NotFoundError) {
            statusCode = 404
        } else if (error instanceof InvalidArgumentError) {
            statusCode = 400
        }

        res.status(statusCode).json({
            error: error.message,
            stack: error.stack,
            name,
        })
    },
)

app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${PORT}...`)
})
