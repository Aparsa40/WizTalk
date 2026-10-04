export interface FallbackAttempt {
  provider: string;
  model?: string;
  success: boolean;
  error?: string;
  latencyMs?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 1,

  retryableErrors: [
    "TIMEOUT",
    "NETWORK_ERROR",
    "RATE_LIMIT",
    "SERVER_ERROR",
    "EMPTY_RESPONSE",
  ],
};


export function shouldRetry(
  errorType: string,
  attempt: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): boolean {

  if (attempt >= policy.maxRetries) {
    return false;
  }

  return policy.retryableErrors.includes(errorType);
}


export function getFallbackOrder() {

  return [
    "primary",
    "secondary",
    "offline",
    "final",
  ];

}


export function createFailureResult(
  attempts: FallbackAttempt[]
) {

  return {

    success: false,

    attempts,

    message:
      "Unable to generate a response at this time.",

  };

}