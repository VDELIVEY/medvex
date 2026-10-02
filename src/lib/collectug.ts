import fs from 'fs';
import path from 'path';

function getServerEnv(name: string) {
  const configured = process.env[name];
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') return '';
  try {
    const line = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
      .split(/\r?\n/)
      .find((entry) => entry.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim() || '';
  } catch {
    return '';
  }
}

export interface InitiateDepositParams {
  amount: number;
  phoneNumber?: string;
  merchantReference?: string;
  customerEmail?: string;
  callbackUrl?: string;
  // For card payments
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  cvv?: string;
}

export interface CollectUGResponse {
  message: string;
  transaction?: {
    transaction_id: string;
    amount: number;
    status: string;
    phone_number?: string;
    card_last4?: string;
  };
  errors?: Record<string, string[]>;
}

export class CollectUGClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || getServerEnv('COLLECTUG_API_KEY');
    this.baseUrl = baseUrl || getServerEnv('COLLECTUG_BASE_URL') || 'https://collectug.com/api';

    if (!this.apiKey) {
      console.warn('CollectUG API Key is not set.');
    }
  }

  /**
   * Initiate a deposit / payment collection (Mobile Money or Card)
   */
  async createDeposit(params: InitiateDepositParams): Promise<CollectUGResponse> {
    const payload: Record<string, any> = {
      amount: params.amount,
      ...(params.phoneNumber && { phoneNumber: params.phoneNumber }),
      ...(params.merchantReference && { merchant_reference: params.merchantReference }),
      ...(params.customerEmail && { customer_email: params.customerEmail }),
      ...(params.callbackUrl && { callback_url: params.callbackUrl }),
      ...(params.cardNumber && { cardNumber: params.cardNumber }),
      ...(params.cardholderName && { cardholderName: params.cardholderName }),
      ...(params.expiryDate && { expiryDate: params.expiryDate }),
      ...(params.cvv && { cvv: params.cvv }),
    };

    const res = await fetch(`${this.baseUrl}/credit-account`, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      const details = data.errors ? `: ${JSON.stringify(data.errors)}` : '';
      throw new Error((data.message || `CollectUG API error (${res.status})`) + details);
    }

    return data;
  }

  /**
   * Withdraw / Disburse funds to a Mobile Money number
   */
  async createWithdrawal(amount: number, phoneNumber: string, callbackUrl?: string): Promise<CollectUGResponse> {
    const res = await fetch(`${this.baseUrl}/debit-account`, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        amount,
        phoneNumber,
        ...(callbackUrl && { callback_url: callbackUrl }),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `CollectUG API error (${res.status})`);
    }

    return data;
  }

  /**
   * Fetch transaction history
   */
  async getTransactions(filters: { status?: string; start_date?: string; end_date?: string; page?: number } = {}) {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.set('status', filters.status);
    if (filters.start_date) queryParams.set('start_date', filters.start_date);
    if (filters.end_date) queryParams.set('end_date', filters.end_date);
    if (filters.page) queryParams.set('page', filters.page.toString());

    const url = `${this.baseUrl}/transactions?${queryParams.toString()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey,
        'Accept': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `CollectUG API error (${res.status})`);
    }

    return data;
  }
}

export const collectUG = new CollectUGClient();
