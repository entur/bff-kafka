// The tracer must be the first import in order to track time to import the other stuff
import './tracer'

import logger from './logger'

import consume from './kafka'

logger.info('Starting kafka to pub sub bridge.')
consume()
    .then(() => console.log('consumed'))
    .catch((reason) => console.log('Kafka failed, giving you up. Sorry, Rick Astley. ', reason))
