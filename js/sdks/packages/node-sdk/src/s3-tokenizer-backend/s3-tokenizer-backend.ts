import { Hash } from '@aws-sdk/hash-node';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner';
import { parseUrl } from '@aws-sdk/url-parser';
import { formatUrl } from '@aws-sdk/util-format-url';

export const lunasecTokenRegex =
  /^lunasec-[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface S3TokenizerBackendConfig {
  s3Bucket: string;
  awsRegion: string;
  awsCredentials?: AwsCredentials;
  getAwsCredentials?: () => Promise<AwsCredentials>;
}

export class S3TokenizerBackend {
  readonly config!: S3TokenizerBackendConfig;

  constructor(config: S3TokenizerBackendConfig) {
    this.config = config;

    if (config.awsCredentials && config.getAwsCredentials) {
      throw new Error('Cannot set both credentials and getCredentials');
    }

    if (!config.awsCredentials && !config.getAwsCredentials) {
      throw new Error('Must set credentials or getAwsCredentials');
    }
  }

  async getAwsCredentials() {
    if (this.config.awsCredentials) {
      return this.config.awsCredentials;
    }

    if (!this.config.getAwsCredentials) {
      throw new Error('Unable to call get AWS Credentials');
    }

    const credentials = await this.config.getAwsCredentials();

    if (!credentials) {
      throw new Error('Missing AWS credentials');
    }

    this.config.awsCredentials = credentials;

    return credentials;
  }

  async generatePresignedS3Url(tokenId: string, method: 'PUT' | 'GET') {
    if (!lunasecTokenRegex.exec(tokenId)) {
      throw new Error('Invalid token passed to S3 URL Signer');
    }

    const credentials = await this.getAwsCredentials();

    const signer = new S3RequestPresigner({
      region: this.config.awsRegion,
      credentials: credentials,
      sha256: Hash.bind(null, 'sha256'), // In Node.js
    });

    const url = parseUrl(`https://${this.config.s3Bucket}.s3.${this.config.awsRegion}.amazonaws.com/${tokenId}`);

    const signedUrl = await signer.presign(
      new HttpRequest({
        ...url,
        method: method,
      })
    );

    return {
      url: formatUrl(signedUrl),
      headers: signedUrl.headers,
    };
  }

  getTokenPresignedUrl(tokenId: string) {
    return this.generatePresignedS3Url(tokenId, 'GET');
  }

  createTokenPresignedUrl(tokenId: string) {
    return this.generatePresignedS3Url(tokenId, 'PUT');
  }
}
