import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import logger from './logger'
import { ENVIRONMENT } from './config'

const client = new SecretManagerServiceClient()

export async function getSecret(key: 'kafka-user' | 'kafka-password'): Promise<string> {
    const secretsPath = `projects/entur-${ENVIRONMENT}/secrets/${key}/versions/latest`
    let version
    try {
        const [secretVersion] = await client.accessSecretVersion({
            name: secretsPath,
        })

        version = secretVersion
    } catch (err) {
        logger.error(err)
        // If you get this when running locally, check that you have authenticated with gcloud,
        // for example using 'gcloud auth application-default login'
        throw Error(`Could not get secret from "${secretsPath}", perhaps the path is wrong?`)
    }

    // Extract the payload as a string.
    const payload = version?.payload?.data?.toString()
    if (!payload) {
        throw Error(
            `Secret "${key}" is undefined, check what is stored in Google Secrets at "${secretsPath}"`,
        )
    }

    logger.debug(`Got secret "${key}" from Google Secret Manager`)
    return payload
}
