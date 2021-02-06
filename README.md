# weg-li API
![CI](https://github.com/weg-li-project/weg-li-api/workflows/CI/badge.svg?branch=main&event=push)

The API for the weg-li [Android App](https://github.com/weg-li-project/wegli-android).

Responsible for managing users anonymously, requesting violation type and severity from user history and location, handling image uploads and trigger car attributes detection from them, and sending reports.

## Setup
Guide on how to setup the different environments for running and deploying the API.

### Prerequisites
1. Install Nodejs 12 + npm
1. Install the GCloud SDK

### Google Cloud
1. Create a Google Cloud Project with Billing activated
1. Enable Cloud Functions API
1. Enable Cloud Build API
1. Enable Cloud Storage API
1. Create a service account key in IAM with the following roles
    - Editor

### Google Cloud Storage
1. Create a bucket for user image uploads

### Google Cloud SQL
1. Create a postgres instance
1. Create database
1. Create tables, indices and triggers (See the Wiki [here](https://github.com/lukastrm/weg-li-project/wiki/Database))
1. Import available data set

### CI/CD
1. In your Github repository settings add the following secrets
    - GCP_PROJECT_ID = Project ID of your Google Cloud Project
    - GCP_SERVICE_ACCOUNT_KEY = Content of a json service account key with all required permissions
    - WEGLI_IMAGES_BUCKET_NAME = Bucket name where the API stores the user images
    - IMAGE_ANALYSIS_ENDPOINT = URL to deployed [CarML Service](https://github.com/weg-li-project/car-ml)
    - DB_NAME = Name of database
    - DB_USER = Username of database
    - DB_PASSWORD = Password of DB_USER
    - DB_SOCKET_PATH = Socket path to Cloud SQL postgres instance
1. Pushes to main will now automatically deploy the API

### Deployment
Make sure you noted every needed environment variable.

For a local deployment run the following command
```shell script
gcloud functions deploy api --allow-unauthenticated \
  --trigger-http \
  --runtime=nodejs12 \
  --region=europe-west3 \
  --memory=1G \
  --set-env-vars=DB_NAME=${{ DB_NAME }},DB_USER=${{ DB_USER }},DB_PASSWORD=${{ DB_PASSWORD }},DB_SOCKET_PATH=${{ DB_SOCKET_PATH }},IMAGE_ANALYSIS_ENDPOINT=${{ IMAGE_ANALYSIS_ENDPOINT }}
```

### Misc
For running the API locally
1. Provide all needed environment variables
1. Run the Cloud SQL Proxy and use DB_HOST instead of DB_SOCKET_PATH

## Testing
First install all dependencies

    npm i
    
For linting run

    npm run lint
    
For unit and integration tests run

    npm test
    
For systemtests run (needs env var `BASE_URL` to be set)

    npm run systemtest


## Contributing
This software is developed for free. You are welcome to contribute and support, here are a few ways:
* Report bugs, make suggestions and new ideas
* Fork the project and do pull requests

## Hall of Fame
* @lukastrm Lukas Trommer
* @niclasku Niclas Kühnapfel

## License
TBD