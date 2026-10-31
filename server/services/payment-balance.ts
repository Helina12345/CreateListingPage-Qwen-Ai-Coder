// ============================================================
// ListingDesk Pro — Payment & Balance Service
// Handles Stripe integration, user balance, and transactions
// ============================================================

import type { ServerBalance, ServerTransaction } from '../types';
import type { DatabaseClient } from './database';

// ============================================================
// TYPES
// ============================================================

export interface AddBalanceRequest {
  userId: string;
  amount: number;
  currency?: string;
  paymentMethodId: string;
  description?: string;
}

export interface ChargeBalanceRequest {
  userId: string;
  amount: number;
  currency?: string;
  description: string;
  referenceId?: string;
}

export interface RefundRequest {
  transactionId: string;
  userId: string;
  amount?: number;
  reason?: string;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

// ============================================================
// PAYMENT & BALANCE SERVICE
// ============================================================

export class PaymentBalanceService {
  private db: DatabaseClient;
  private stripeSecretKey: string;

  constructor(db: DatabaseClient, stripeSecretKey: string) {
    this.db = db;
    this.stripeSecretKey = stripeSecretKey;
  }

  // ============================================================
  // GET USER BALANCE
  // ============================================================

  async getUserBalance(userId: string): Promise<ServerBalance> {
    let balance = await this.db.balance.findByUserId(userId);

    if (!balance) {
      // Create initial balance
      balance = await this.db.balance.create({
        userId,
        amount: 0,
        currency: 'USD',
      });
    }

    return balance;
  }

  // ============================================================
  // ADD BALANCE (TOP UP)
  // ============================================================

  async addBalance( AddBalanceRequest): Promise<{ balance: ServerBalance; transaction: ServerTransaction }> {
    const { userId, amount, currency = 'USD', paymentMethodId, description } = data;

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Create payment intent with Stripe
    const paymentIntent = await this.createStripePaymentIntent(amount, currency, paymentMethodId);

    // Confirm payment
    const confirmed = await this.confirmStripePayment(paymentIntent.id);

    if (confirmed.status !== 'succeeded') {
      throw new Error('Payment failed');
    }

    // Update balance
    const balance = await this.getUserBalance(userId);
    const newAmount = balance.amount + amount;

    await this.db.balance.update(userId, newAmount);

    // Create transaction
    const transaction = await this.db.transaction.create({
      userId,
      type: 'credit',
      amount,
      currency,
      description: description || 'Balance top-up',
      stripePaymentId: paymentIntent.id,
      status: 'completed',
    });

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'balance.added',
      resource: 'balance',
      resourceId: userId,
      changes: { amount, newBalance: newAmount },
    });

    return {
      balance: await this.getUserBalance(userId),
      transaction,
    };
  }

  // ============================================================
  // CHARGE BALANCE (AUTO-CHARGE FOR SUPPLIER ORDERS)
  // ============================================================

  async chargeBalance( ChargeBalanceRequest): Promise<{ balance: ServerBalance; transaction: ServerTransaction }> {
    const { userId, amount, currency = 'USD', description, referenceId } = data;

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Get current balance
    const balance = await this.getUserBalance(userId);

    if (balance.amount < amount) {
      throw new Error('Insufficient balance');
    }

    // Deduct balance
    const newAmount = balance.amount - amount;
    await this.db.balance.update(userId, newAmount);

    // Create transaction
    const transaction = await this.db.transaction.create({
      userId,
      type: 'debit',
      amount,
      currency,
      description,
      referenceId,
      status: 'completed',
    });

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'balance.charged',
      resource: 'balance',
      resourceId: userId,
      changes: { amount, newBalance: newAmount, referenceId },
    });

    return {
      balance: await this.getUserBalance(userId),
      transaction,
    };
  }

  // ============================================================
  // REFUND TRANSACTION
  // ============================================================

  async refund( RefundRequest): Promise<{ balance: ServerBalance; transaction: ServerTransaction }> {
    const { transactionId, userId, amount, reason } = data;

    // Get original transaction
    const originalTransaction = await this.db.transaction.findById(transactionId);

    if (!originalTransaction || originalTransaction.userId !== userId) {
      throw new Error('Transaction not found');
    }

    if (originalTransaction.type !== 'debit') {
      throw new Error('Can only refund debit transactions');
    }

    if (originalTransaction.status === 'refunded') {
      throw new Error('Transaction already refunded');
    }

    const refundAmount = amount || originalTransaction.amount;

    if (refundAmount > originalTransaction.amount) {
      throw new Error('Refund amount exceeds original transaction');
    }

    // Refund via Stripe if applicable
    if (originalTransaction.stripePaymentId) {
      await this.createStripeRefund(originalTransaction.stripePaymentId, refundAmount);
    }

    // Update balance
    const balance = await this.getUserBalance(userId);
    const newAmount = balance.amount + refundAmount;
    await this.db.balance.update(userId, newAmount);

    // Create refund transaction
    const transaction = await this.db.transaction.create({
      userId,
      type: 'credit',
      amount: refundAmount,
      currency: originalTransaction.currency,
      description: reason || 'Refund',
      referenceId: transactionId,
      status: 'completed',
    });

    // Mark original transaction as refunded
    await this.db.transaction.update(originalTransaction.id, {
      status: 'refunded',
    });

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'balance.refunded',
      resource: 'balance',
      resourceId: userId,
      changes: { amount: refundAmount, newBalance: newAmount, originalTransactionId: transactionId },
    });

    return {
      balance: await this.getUserBalance(userId),
      transaction,
    };
  }

  // ============================================================
  // GET TRANSACTION HISTORY
  // ============================================================

  async getTransactionHistory(userId: string, filters?: { type?: string; limit?: number }): Promise<ServerTransaction[]> {
    return await this.db.transaction.findByUserId(userId, filters);
  }

  // ============================================================
  // CREATE STRIPE PAYMENT INTENT
  // ============================================================

  private async createStripePaymentIntent(
    amount: number,
    currency: string,
    paymentMethodId: string
  ): Promise<StripePaymentIntent> {
    // In actual backend, use Stripe SDK
    // const stripe = new Stripe(this.stripeSecretKey);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Convert to cents
    //   currency,
    //   payment_method: paymentMethodId,
    //   confirm: true,
    // });

    // return {
    //   id: paymentIntent.id,
    //   amount: paymentIntent.amount / 100,
    //   currency: paymentIntent.currency,
    //   status: paymentIntent.status,
    //   clientSecret: paymentIntent.client_secret,
    // };

    throw new Error('Stripe payment intent creation must be implemented in backend');
  }

  // ============================================================
  // CONFIRM STRIPE PAYMENT
  // ============================================================

  private async confirmStripePayment(paymentIntentId: string): Promise<{ status: string }> {
    // In actual backend, use Stripe SDK
    // const stripe = new Stripe(this.stripeSecretKey);
    // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // return { status: paymentIntent.status };

    throw new Error('Stripe payment confirmation must be implemented in backend');
  }

  // ============================================================
  // CREATE STRIPE REFUND
  // ============================================================

  private async createStripeRefund(paymentIntentId: string, amount: number): Promise<void> {
    // In actual backend, use Stripe SDK
    // const stripe = new Stripe(this.stripeSecretKey);
    // await stripe.refunds.create({
    //   payment_intent: paymentIntentId,
    //   amount: Math.round(amount * 100), // Convert to cents
    // });

    throw new Error('Stripe refund creation must be implemented in backend');
  }

  // ============================================================
  // HANDLE STRIPE WEBHOOK
  // ============================================================

  async handleStripeWebhook(event: any): Promise<void> {
    // In actual backend, verify webhook signature and handle events
    // const stripe = new Stripe(this.stripeSecretKey);
    // const sig = request.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(requestBody, sig, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    // Update transaction status
    // const transaction = await this.db.transaction.findByStripePaymentId(paymentIntent.id);
    // if (transaction) {
    //   await this.db.transaction.update(transaction.id, { status: 'completed' });
    // }
  }

  private async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    // Update transaction status
    // const transaction = await this.db.transaction.findByStripePaymentId(paymentIntent.id);
    // if (transaction) {
    //   await this.db.transaction.update(transaction.id, { status: 'failed' });
    // }
  }

  private async handleChargeRefunded(charge: any): Promise<void> {
    // Handle refund webhook
  }

  // ============================================================
  // CHECK BALANCE AND AUTO-CHARGE
  // ============================================================

  async checkBalanceAndAutoCharge(
    userId: string,
    requiredAmount: number,
    description: string,
    referenceId?: string
  ): Promise<void> {
    const balance = await this.getUserBalance(userId);

    if (balance.amount < requiredAmount) {
      throw new Error(`Insufficient balance. Required: $${requiredAmount}, Available: $${balance.amount}`);
    }

    await this.chargeBalance({
      userId,
      amount: requiredAmount,
      description,
      referenceId,
    });
  }

  // ============================================================
  // GENERATE INVOICE
  // ============================================================

  async generateInvoice(userId: string, transactionIds: string[]): Promise<string> {
    // In actual backend, generate PDF invoice
    // const transactions = await Promise.all(
    //   transactionIds.map((id) => this.db.transaction.findById(id))
    // );

    // const invoice = {
    //   userId,
    //   transactions,
    //   total: transactions.reduce((sum, t) => sum + t.amount, 0),
    //   generatedAt: new Date(),
    // };

    // const pdf = await generatePDF(invoice);
    // return pdf.url;

    throw new Error('Invoice generation must be implemented in backend');
  }
}
