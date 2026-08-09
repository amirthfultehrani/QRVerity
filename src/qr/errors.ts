/**
 * PureQR Domain Error Hierarchy
 */

export class QrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QrError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class QrEncodingError extends QrError {
  constructor(message: string) {
    super(message);
    this.name = 'QrEncodingError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class QrInputError extends QrError {
  constructor(message: string) {
    super(message);
    this.name = 'QrInputError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class QrVersionError extends QrError {
  constructor(message: string) {
    super(message);
    this.name = 'QrVersionError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
