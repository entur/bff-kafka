/*
 KAFKA

 NB - password for Kafka, set in GCP Secrets as 'kafka-password'
 must match selected Kafka instance. Kafka password is found in
 LastPass as 'Shared Kafka - Entur - User - Internal/External Prod' and '...Test'.
 */
export const ENVIRONMENT: string

export const KAFKA_BROKER: string
export const KAFKA_SCHEMA_REGISTRY: string
export const PARTNER_AUDIENCE: string
export const PARTNER_HOST: string
