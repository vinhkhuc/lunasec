import * as http from 'http';

import { makeRequest } from '@lunasec/server-common';

import { Configuration, DefaultApi } from '../generated';

import { Requests, Responses } from './types';

export enum TOKENIZER_ERROR_CODES {
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
}

export interface TokenizerSuccessApiResponse<R extends { data: Record<any, any> }> {
  success: true;
  data: R['data'];
}

export interface TokenizerFailApiResponse {
  success: false;
  error: Error;
  errorCode?: TOKENIZER_ERROR_CODES;
}

export type SomeTokenizerAPIResponse<R extends { data: Record<any, any> }> =
  | TokenizerSuccessApiResponse<R>
  | TokenizerFailApiResponse;

type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : any;

export class TokenizerApiWrapper {
  headers: http.ClientRequestArgs;

  constructor(host: string, headers: http.OutgoingHttpHeaders) {
    this.headers = headers;
  }

  public async wrap<F extends (body: any, opts?: any) => Promise<{ data: Record<any, any> }>>(
    reqMethod: F,
    reqBody: Parameters<F>[0]
  ): Promise<SomeTokenizerAPIResponse<AsyncReturnType<F>>> {
    try {
      // TODO: Add runtime JSON validation for response
      const response = await reqMethod(reqBody, { headers: this.headers });

      if (!response) {
        return {
          success: false,
          error: new Error(
            response !== undefined ? response : 'Malformed response from API with missing error message'
          ),
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
  }
}
//
// public async call<R extends keyof Requests>(route: R, body: Requests[R]): Promise<SomeTokenizerAPIResponse<R>> {
//   try {
//     // TODO: Add runtime JSON validation for response
//     const fullRoute = this.baseRoute + route;
//     const response = await makeRequest<Responses[R]>(this.host, fullRoute, this.params, JSON.stringify(body));
//
//     if (!response) {
//   return {
//     success: false,
//     error: new Error(
//       response !== undefined ? response : 'Malformed response from API with missing error message'
//     ),
//   };
// }
//
// return {
//   success: true,
//   data: response,
// };
// } catch (e) {
//   return {
//     success: false,
//     error: e,
//   };
// }
// }

// export async function makeSecureApiRequest<
//   T extends ValidTokenizerApiRequestTypes,
//   TRequest extends TokenizerRequests[T]
// >(
//   request: TRequest,
//   host: string,
//   path: string,
//   params: http.ClientRequestArgs
// ): Promise<TokenizerSuccessApiResponse<TokenizerRequestResponseMessageMap[T]> | TokenizerFailApiResponse> {}
//
// export type GenericApiClient = <R extends keyof TokenizerRequests>(
//   request: TokenizerRequests[R],
//   requestOverrides?: http.ClientRequestArgs
// ) => Promise<TokenizerSuccessApiResponse<TokenizerResponses[R]> | TokenizerFailApiResponse>;
//
// export function makeGenericApiClient(
//   host: string,
//   path: string,
//   requestBaseConfig: http.ClientRequestArgs
// ): GenericApiClient {
//   return async <T extends keyof TokenizerRequests>(
//     request: TokenizerRequests[T],
//     requestOverrides?: http.ClientRequestArgs
//   ) => {
//     const requestConfig = Object.assign({}, requestBaseConfig, requestOverrides);
//     return await makeSecureApiRequest<T, TokenizerRequests[T]>(request, host, path, requestConfig);
//   };
// }

//
// export type SpecificApiClient<T extends ValidTokenizerApiRequestTypes> = (
//   request: TokenizerRequests[T],
//   requestOverrides?: http.ClientRequestArgs
// ) => Promise<TokenizerSuccessApiResponse<TokenizerRequestResponseMessageMap[T]> | TokenizerFailApiResponse>;
//
// export function makeSpecificApiClient<T extends ValidTokenizerApiRequestTypes>(
//   host: string,
//   path: string,
//   requestBaseConfig: http.ClientRequestArgs
// ) {
//   const genericApiClient = makeGenericApiClient(host, path, requestBaseConfig);
//
//   return async (request: TokenizerRequests[T], requestOverrides?: http.ClientRequestArgs) => {
//     return await genericApiClient<T>(request, requestOverrides);
//   };
// }
