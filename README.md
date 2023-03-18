# Requirements

- Git - https://git-scm.com/download
- Github CLI - `brew install gh`, `gh auth login`
- Node.js (18.x) - `brew install node@18`
- pnpm - `brew install pnpm`
- AWS CDK - `brew install aws-cdk`
- AWS CLI - `brew install awscli`

# CDK

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Deploying to AWS

1. Create a new IAM User
2. Create an Access Key for that IAM User
3. Run `aws configure` and enter the credentials
4. Run `pnpm run build`
5. Run `cdk synth`
6. Run `cdk deploy`

NOTE: Delete the Access Key if you're not going to use it again for a while.

TODO: Investigate https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
