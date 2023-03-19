import * as cdk from 'aws-cdk-lib';
import * as apigateway from '@aws-cdk/aws-apigatewayv2-alpha';
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class LinkedinEmailAutoresponderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFunction = new lambda.NodejsFunction(
      this,
      'LinkedinEmailAutoresponderHandler',
      {
        functionName: 'LinkedinEmailAutoresponderHandler',
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        entry: 'lambda/index.ts',
      }
    );

    // Grant read and write access to Secrets Manager
    lambdaFunction.addToRolePolicy(
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
        lambdaFunction
      ),
    });

    new cdk.CfnOutput(this, 'HttpApiUrl', {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      value: httpApi.url!,
    });
  }
}
