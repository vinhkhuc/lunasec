import { Buffer } from 'buffer';
import crypto from 'crypto';

import { AuthenticationError } from 'apollo-server-express';

import { Models } from '../../../common/models';
import { AppContext } from '../graphql/graphql-apollo-server';

export function getUserOrThrow(context: AppContext) {
  const user = context.getUser();
  if (!user) {
    throw new AuthenticationError('User is not logged in');
  }
  return user;
}

// Tell LunaSec how to read a user identifier out of the request object.  Technically any ID will work, but the sessionId is often a good choice.
// If you'd like to allow users to use LunaSec elements without being logged in, consider generating a temporary session for them.
export function readSessionFromRequest(req: Express.Request): Promise<string | null> {
  // LunaSec expects this to return a promise in case we need to do something async
  return new Promise((resolve) => {
    if (req.session.id) {
      console.log('READ SESSION FROM REQUEST graphql server', req.session.id);
      return resolve(req.session.id);
    }
    return resolve(null); // LunaSec Elements will not work in this case
  });
}

function comparePassword(passwordToCheck: string, storedPasswordHash: string, salt: string): Promise<boolean | Error> {
  return new Promise((resolve, _reject) => {
    crypto.pbkdf2(passwordToCheck, salt, 10000, 32, 'sha256', function (err, reqPassHash) {
      if (err) {
        return resolve(err);
      }

      const passwordCorrect = crypto.timingSafeEqual(Buffer.from(storedPasswordHash), reqPassHash);
      resolve(passwordCorrect);
    });
  });
}

export async function authenticateUser(models: Models, username: string, password: string) {
  const userRecord = await models.user.getUserWithPasswordHash(username);

  if (!userRecord) {
    throw new Error('Incorrect username or password.');
  }

  const passwordCorrect = await comparePassword(password, userRecord.hashed_password, userRecord.salt);
  if (passwordCorrect instanceof Error) {
    throw passwordCorrect;
  }
  if (!passwordCorrect) {
    throw new Error('Incorrect username or password.');
  }

  const user = {
    id: userRecord.id.toString(),
    username: userRecord.username,
    ssn_token: userRecord.ssn_token,
  };
  return user;
}
