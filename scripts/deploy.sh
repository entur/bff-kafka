#!/bin/bash

set -e

if [ -z "$ENTUR_DEPLOY_SLACK_WEBHOOK" ] ; then
 echo
 echo "👮‍♀️ Stop there! Could not find the Slack webhook URL. Please make sure this variable is exported:"
 echo
 echo "  ENTUR_DEPLOY_SLACK_WEBHOOK"
 echo
 exit 1
fi

function deploy {
    ENV="${1:-dev}"

    if ! [[ "$ENV" =~ ^(dev|staging|prod|beta|terraform)$ ]]; then
        echo -e "🙈 Invalid ENV: $ENV\n"
        exit 1
    fi

    if [[ $ENV = "terraform" ]]; then
        PROJECT="ent-selvbet-terraform-dev"
    else
        PROJECT="entur-$ENV"
    fi

    echo " 🧵  Linting ..."
    npm run lint

    echo " 🚢  Deploying BFF Kafka to $ENV ..."
    npm run build:$ENV && gcloud app deploy app-$ENV.yaml --project=$PROJECT --quiet

    echo " ⏰  Creating cron jobs ..."
    # The urls below do not exist in the app. Instead, all urls are accepted and url inspected in http.ts.
    # Cron-triggered calls bypass the firewall btw.

    KEEPALIVE_JOB="bff-kafka-keepalive"
    if gcloud scheduler jobs list --project=$PROJECT | grep -c $KEEPALIVE_JOB; then
        echo " 🗑️  Deleting existing keep-alive cron job $HAS_KAFKA_KEEPALIVE..."
        gcloud scheduler jobs delete $KEEPALIVE_JOB --quiet --location="us-central1" --project=$PROJECT
    fi
    echo " 👷🏻‍♀️ Creating keep-alive cron job ..."
    gcloud scheduler jobs create app-engine $KEEPALIVE_JOB --service="bff-kafka" --schedule="every 5 mins" --relative-url="/bff-kafka/keepalive" --http-method=GET --description="Tic, toc, I'm a clock. I prevent bff-kafka from idle timeouts." --project=$PROJECT

    HEARTBEAT_JOB="bff-kafka-heartbeat"
    if gcloud scheduler jobs list --project=$PROJECT | grep -c $HEARTBEAT_JOB; then
        echo " 🗑️  Deleting existing heartbeat cron job ..."
        gcloud scheduler jobs delete $HEARTBEAT_JOB --quiet --location="us-central1" --project=$PROJECT
    fi
    echo " 👷🏻‍♀️ Creating heartbeat cron job ..."
    gcloud scheduler jobs create app-engine $HEARTBEAT_JOB --service="bff-kafka" --schedule="every 1 mins" --relative-url="/bff-kafka/heartbeat" --http-method=GET --description="Can you feel a heartbeat, Doctor? No, he's dead, Jim." --project=$PROJECT

    echo " 💬 Posting message to Slack ..."
    slack_message $ENV
}

function slack_message {
    ENV=$1
    BRANCH="$(git symbolic-ref HEAD 2>/dev/null)" ||
    BRANCH="(unnamed branch)"
    BRANCH=${BRANCH##refs/heads/}

    COMMIT="$(git rev-parse --short HEAD)"

    if [[ $(git diff --stat) != '' ]]; then
        COMMIT_MSG="(\`$COMMIT\` DIRTY :poop:)"
    else
        COMMIT_MSG="(\`$COMMIT\`)"
    fi

    curl -X POST \
        --data-urlencode "payload={\"channel\": \"#team-app-build\", \"username\": \"BFF Kafka deployed to $ENV\", \"text\": \"\`$USER\` deployed *BFF Kafka* to :$ENV: from branch \`$BRANCH\` $COMMIT_MSG\", \"icon_emoji\": \":franz:\"}" \
        "$ENTUR_DEPLOY_SLACK_WEBHOOK"
}

ENV_ARGS="${@:-dev}"
for ENV_ARG in $ENV_ARGS
do
    deploy "$ENV_ARG"
done
