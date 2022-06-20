/*
 * Copyright by LunaSec (owned by Refinery Labs, Inc)
 *
 * Licensed under the Business Source License v1.1
 * (the "License"); you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 * https://github.com/lunasec-io/lunasec/blob/master/licenses/BSL-LunaTrace.txt
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import * as util from 'util';

import { SendMessageCommand } from '@aws-sdk/client-sqs';

import { sqsClient } from '../../aws/sqs-client';
import { getAwsConfig } from '../../config';
import { hasura } from '../../hasura-api';
import { FakeS3SqsRecord, S3SqsMessage } from '../../types/sqs';
import { log } from '../../utils/log';
import { loadQueueUrlOrExit } from '../../utils/sqs';

const logger = log.child('rescan-builds-job');
const { awsRegion } = getAwsConfig();

export async function rescanLatestBuilds() {
  logger.info('Attempting to queue all recent builds for rescanning');
  const buildsRes = await hasura.GetLatestBuildsForRescan();
  const builds = buildsRes.latest_builds;
  if (!builds) {
    logger.error('Failed to fetch latest builds from hasura', { buildsRes });
  }
  const fakeS3Messages: S3SqsMessage[] = [];
  builds.forEach((build) => {
    if (!build.s3_url) {
      // This will happen for any builds we catch in progress, or any that had issues during upload. Just skip them.
      return;
    }
    const s3Url = new URL(build.s3_url);
    const key = s3Url.pathname.substring(1);
    const bucketName = s3Url.host.split('.')[0];
    if (!bucketName) {
      logger.error('failed to split bucket name out of s3 url from build', { build });
    }
    const record: FakeS3SqsRecord = {
      s3: { object: { key }, bucket: { name: bucketName } },
      awsRegion,
    };
    fakeS3Messages.push({ Records: [record] });
  });
  logger.log('sending ', fakeS3Messages.length, ' sqs messages to queue scans');
  console.log(util.inspect(fakeS3Messages, { depth: Infinity, colors: true }));
  const sqsPromises = fakeS3Messages.map(sendSqsMessage);
  await Promise.all(sqsPromises);
  logger.log('donezo');
}

// TODO: if called from a webhook this needs to be renamed to be clear.. or passed as an arg or something
const queueName = 'lunatrace-forrest-EtlStorage-LunaTraceDevelopmentQueue04E796C2-FmrSZGlohvYO'; // checkEnvVar('QUEUE_NAME');
// Send pretend S3 events to trigger builds on the same queue as the s3 events
// It may someday be necessary to break this into a separate queue/worker if it effects the UX speed of other jobs
async function sendSqsMessage(fakeS3Record: S3SqsMessage) {
  // This caches internally
  const queueUrl = await loadQueueUrlOrExit(queueName);
  const r = await sqsClient.send(
    new SendMessageCommand({
      MessageBody: JSON.stringify(fakeS3Record),
      QueueUrl: queueUrl,
    })
  );
  if (r.$metadata.httpStatusCode) {
    if (r.$metadata.httpStatusCode > 299) {
      logger.error('Failed to send sqs message', { metadata: r.$metadata });
    }
  }
  return;
}

void rescanLatestBuilds();
