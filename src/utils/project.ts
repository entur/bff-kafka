import { ENVIRONMENT } from '../config.js'

export const getProjectId = (): string => {
    if (ENVIRONMENT === 'nordic-dev') {
        return 'ent-clients-nordic-dev'
    } else if (ENVIRONMENT === 'terraform') {
        return 'ent-selvbet-terraform-dev'
    } else {
        return `entur-${ENVIRONMENT}`
    }
}
