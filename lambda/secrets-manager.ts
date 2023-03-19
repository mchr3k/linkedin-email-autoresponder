import {
  SecretsManagerClient,
  DescribeSecretCommand,
  CreateSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManagerClient({});

export async function getSecretValue(secretId: string): Promise<string> {
  try {
    const response = await secretsManager.send(
      new GetSecretValueCommand({ SecretId: secretId })
    );
    if (response.SecretString) {
      return response.SecretString;
    } else {
      throw new Error(`SecretString is not available for secret: ${secretId}`);
    }
  } catch (error) {
    console.error(`Error retrieving secret: ${secretId}`, error);
    throw error;
  }
}

export async function putSecretValue(
  secretId: string,
  secretString: string
): Promise<void> {
  try {
    // Check if the secret exists
    await secretsManager.send(
      new DescribeSecretCommand({ SecretId: secretId })
    );
  } catch (error: unknown) {
    // If the secret doesn't exist, create it
    if (error instanceof Error && error.name === 'ResourceNotFoundException') {
      try {
        await secretsManager.send(
          new CreateSecretCommand({
            Name: secretId,
            SecretString: secretString,
          })
        );
        console.log(`Created secret: ${secretId}`);
        return;
      } catch (createError) {
        console.error(
          `Failed to create secret: ${JSON.stringify(createError)}`
        );
        throw createError;
      }
    } else {
      console.error(`Failed to describe secret: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  try {
    // If the secret exists, update its value
    await secretsManager.send(
      new PutSecretValueCommand({
        SecretId: secretId,
        SecretString: secretString,
      })
    );
  } catch (error) {
    console.error(`Failed to put secret value: ${JSON.stringify(error)}`);
    throw error;
  }
}
