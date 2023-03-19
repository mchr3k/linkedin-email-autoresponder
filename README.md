# Local development requirements

- Git - https://git-scm.com/download
- Github CLI - `brew install gh`, `gh auth login`
- VSCode - https://code.visualstudio.com/
- Node.js (18.x) - `brew install node@18`
- AWS CLI - `brew install awscli`
- AWS CDK - `brew install aws-cdk`

# Prep for deploying to AWS

1. Create a new IAM User
2. Create an Access Key for that IAM User
3. Run `aws configure` and enter the credentials

NOTE: Delete the Access Key if you're not going to use it again for a while.

TODO: Investigate https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html

# Deploying to AWS

1. Run `npm run build`
2. Run `cdk synth`
3. Run `cdk deploy`

You can then iterate on the stack and re-deploy it by running:
`npm run build && cdk synth && cdk deploy`

# Manual setup in Google

1. Create a new Google Project - https://console.cloud.google.com/projectcreate
2. Enable the "Gmail API" - https://console.cloud.google.com/apis/.
3. Configure OAuth Consent Screen, including scopes ["/auth/gmail.labels", "/auth/gmail.modify"], and including yourself as a Test User
4. Configure Credentials - Create "OAuth 2.0 Client ID", configure `LinkedinEmailAutoresponderStack.HttpApiUrl` as an "Authorised redirect URI", download Credentials JSON

# Manual setup in AWS

1. Create a secret called "GmailCredentials" in AWS Secrets Manager and populate it with the Credentials JSON value
2. Create a secret called "LinkedinAutoreplyMessage" in AWS Secrets Manager and populate it with the autoreply message which you want to use

# Authenticating to Gmail API

https://developers.google.com/identity/protocols/oauth2

> A Google Cloud Platform project with an OAuth consent screen configured for an external user type and a publishing status of "Testing" is issued a refresh token expiring in 7 days

Deploying this code to AWS will output a line like this:

```
Outputs:
LinkedinEmailAutoresponderStack.HttpApiUrl = https://123abc456.execute-api.eu-west-1.amazonaws.com/
```

Load this URL in your browser and accept the Google permissions prompt. If this is successful you'll land back on a page which says something like:

```
Authenticated successfully! - 2023-03-19T18:57:38.422Z
```
