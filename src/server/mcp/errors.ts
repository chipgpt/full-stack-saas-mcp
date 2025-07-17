export class SafeError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class MissingReadScopeError extends SafeError {
  constructor() {
    super('You do not have permission to access this resource');
  }
}

export class MissingWriteScopeError extends SafeError {
  constructor() {
    super('You do not have permission to use tools');
  }
}
export class MissingProfileError extends SafeError {
  constructor() {
    super(
      'Content creator profile is incomplete. It can be updated with the `update-content-creator-profile` tool.'
    );
  }
}
