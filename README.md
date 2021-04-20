# 🔍 Entur BFF Kafka 🔎

A backend service listening to Kafka messages

## Overview

### Background and Goals

## 📦 Install

Node.js version >= 12 is required, so make sure you have that installed.

```
npm install
```

## 🛠 Develop

Run `npm run <env>` to run the server locally.

```
npm run dev
npm run staging
npm run prod
```

The default port is **9000**. You can override it with the `PORT` environment variable.

---

## 🚦 Test

We use **Jest** for together with the `ts-jest` TypeScript preprocessor for testing. To run all tests:

```
npm t
```

---

## 🚢 Deploy

```
npm run deploy // dev is the default
npm run deploy dev
npm run deploy staging
npm run deploy prod
```

This will deploy the app to **gcloud**.

# Google cloud environment

Staging is used as an example:

## Service Account

IAM & Admin -> Service Accounts

name: `bff-kafka` (or another name you would like to use)

This is an account that can be used to run the app locally. It contains
the keys necessary, see [the service account keys readme.](serviceAccountKeys/README.md)

---

## App engine

Node-app (this repo) is deployed on App engine using

`npm run deploy staging`

---

## Pub/Sub

This app publishes to Google Pub/Sub

PubSub topic: `bff-kafka-{kafka-topic}` (kafka topic is without environment)

Published messages have an attribute that can be used for filtering:
eventName = Kafka event name

The message body is a json version of the Kafka event.

---

## Secret manager

The Kafka username and password are fetched from **Secret manager** for the environment.

keys: `kafka-user`, `kafka-password`

Make sure you have created these secrets in each project.

## Cloud Scheduler

A cron job is run from the cloud scheduler. It accesses an endpoint on the
app every x minutes to prevent idle timeouts. Timeouts are not a big problem by
themselves, but starting the app takes a few seconds which would delay ticket
issuing.

The job is configured in `cron.yaml` and can be seen under

`Tools > Cloud Scheduler > App engine cron jobs`

## Subscribing to messages

Pubsub messages can trigger cloud functions. Here is an example function
that listens to `bff-kafka-payment-events`, checks the eventName and decodes the body.

NB: We do not have any type safety built into the pubsub system yet, so the cast
is unsafe if the Kafka Avro message changes.

```
import { region } from 'firebase-functions'

export default region('europe-west1')
    .pubsub.topic('bff-kafka-payment-events')
    .onPublish(async (message) => {
    if (message.attributes.eventName === 'PaymentTransactionCaptured') {
        const pubsubData: PaymentTransactionCaptured = JSON.parse(decodeBase64(message.data))
        await createTicketGroup(pubsubData)
    }
})
```

# Setup from scratch on Google Cloud Platform

Setup setup bff-kafka in an environment on GCP that already runs our other functions, do the
following:

### Create service account

Go to IAM & Admin -> Service Account -> Create service account

-   Name: `bff-kafka`
-   Id: `bff-kafka`
-   Description: `Backend for frontend - Kafka bridge`

Create a new key, either during the dialog or afterwards:

-   Keys -> Create key -> json
-   Download and put in serviceAccountKeys (see [the service account keys readme.](serviceAccountKeys/README.md))

### Setup permissions

Make sure your service accounts have read access to the secrets in Secret Manager

-   Go to Secret Manager and select one of your secrets, for instance `kafka-password`
-   press add permission
-   Add the role "Secret Manager Secret Accessor" to your service accounts

Either run deploy or create the bff-kafka-event pubsub topic (see below)

Go to Pub/sub

-   check bff-kafka-event
-   add permission
-   Add role "Pub/Sub Publisher" to your service account

### Deploy app from localhost

`npm run deploy <environment>`

This sets up app engine and cron job and - from the look of it - pub/sub topic. If not, create a
new pub/sub topic named `bff-kafka-event`.

You need to do this last even if you did it earlier, as it can't start without the proper
permissions set.
