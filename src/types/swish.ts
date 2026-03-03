/** Swish Payment API v2 Types */

export interface SwishPaymentRequest {
  /** Merchant reference, 1-35 chars alphanumeric */
  payeePaymentReference?: string;
  /** HTTPS callback URL for payment result notification */
  callbackUrl: string;
  /** Payer phone number (e-commerce only). Format: country code + number, 8-15 digits */
  payerAlias?: string;
  /** Merchant Swish number */
  payeeAlias: string;
  /** Amount in SEK (0.01 - 999999999999.99) */
  amount: string;
  /** Currency - only SEK supported */
  currency: 'SEK';
  /** Message shown to customer, max 50 chars */
  message?: string;
  /** Unique identifier for callback validation, 32-36 alphanumeric chars */
  callbackIdentifier?: string;
}

export type SwishPaymentStatus =
  | 'CREATED'
  | 'PAID'
  | 'DECLINED'
  | 'ERROR'
  | 'CANCELLED';

export interface SwishPaymentCallback {
  id: string;
  payeePaymentReference: string;
  paymentReference: string;
  callbackUrl: string;
  payerAlias: string;
  payeeAlias: string;
  amount: number;
  currency: string;
  message: string;
  status: SwishPaymentStatus;
  dateCreated: string;
  datePaid?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface SwishRefundRequest {
  /** Payment reference from the original payment */
  originalPaymentReference: string;
  /** HTTPS callback URL for refund result notification */
  callbackUrl: string;
  /** Merchant Swish number */
  payerAlias: string;
  /** Amount to refund in SEK */
  amount: string;
  /** Currency - only SEK supported */
  currency: 'SEK';
  /** Message, max 50 chars */
  message?: string;
  /** Unique identifier for callback validation */
  callbackIdentifier?: string;
}

export type SwishRefundStatus =
  | 'CREATED'
  | 'DEBITED'
  | 'PAID'
  | 'ERROR';

export interface SwishRefundCallback {
  id: string;
  originalPaymentReference: string;
  payerPaymentReference: string;
  callbackUrl: string;
  payerAlias: string;
  payeeAlias: string;
  amount: number;
  currency: string;
  message: string;
  status: SwishRefundStatus;
  dateCreated: string;
  datePaid?: string;
  errorCode?: string;
  errorMessage?: string;
}

/** Client-side payment creation request */
export interface CreatePaymentParams {
  amount: string;
  message?: string;
  /** Payer phone number for e-commerce flow (omit for m-commerce/QR) */
  payerAlias?: string;
  payeePaymentReference?: string;
}

/** Response from our create-payment API */
export interface CreatePaymentResponse {
  id: string;
  token?: string;
  /** Deep link to trigger Swish app on mobile */
  swishUrl?: string;
  /** QR code content string (prefix "D" + token) */
  qrContent?: string;
}

/** Response from our status API */
export interface PaymentStatusResponse {
  id: string;
  status: SwishPaymentStatus;
  amount?: number;
  currency?: string;
  datePaid?: string;
  errorCode?: string;
  errorMessage?: string;
}

/** Response from our refund API */
export interface CreateRefundResponse {
  id: string;
  location: string;
}
