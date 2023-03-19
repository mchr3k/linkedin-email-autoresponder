import * as cdk from 'aws-cdk-lib';
import * as apigateway from '@aws-cdk/aws-apigatewayv2-alpha';
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';

export class LinkedinEmailAutoresponderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authLambda = new lambda.NodejsFunction(
      this,
      'GmailApiAuthentication',
      {
        functionName: 'GmailApiAuthentication',
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        entry: 'lambda/index-auth.ts',
      }
    );

    authLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'secretsmanager:DescribeSecret',
          'secretsmanager:CreateSecret',
          'secretsmanager:GetSecretValue',
          'secretsmanager:PutSecretValue',
        ],
        resources: ['arn:aws:secretsmanager:*:*:secret:*'],
      })
    );

    const httpApi = new apigateway.HttpApi(this, 'api-gateway', {
      corsPreflight: {
        allowHeaders: ['Content-Type'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['*'],
      },
    });

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigateway.HttpMethod.ANY],
      integration: new integrations.HttpLambdaIntegration(
        'http-lambda',
        authLambda
      ),
    });

    new cdk.CfnOutput(this, 'HttpApiUrl', {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      value: httpApi.url!,
    });

    const emailLambda = new lambda.NodejsFunction(
      this,
      'LinkedInEmailAutoResponder',
      {
        functionName: 'LinkedInEmailAutoResponder',
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        entry: 'lambda/index-email.ts',
        timeout: Duration.minutes(5),
      }
    );

    emailLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'secretsmanager:DescribeSecret',
          'secretsmanager:GetSecretValue',
        ],
        resources: ['arn:aws:secretsmanager:*:*:secret:*'],
      })
    );

    const dynamoTable = new Table(this, 'LinkedInReplyTable', {
      tableName: 'LinkedInReplyTable',
      partitionKey: { name: 'senderName', type: AttributeType.STRING },
      sortKey: { name: 'subject', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    dynamoTable.grantReadWriteData(emailLambda);

    const hourlyRule = new Rule(this, 'HourlyRule', {
      schedule: Schedule.rate(cdk.Duration.hours(1)),
    });
    hourlyRule.addTarget(new LambdaFunction(emailLambda));
  }
}
