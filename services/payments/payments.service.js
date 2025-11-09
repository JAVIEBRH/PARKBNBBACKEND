import Payment from '../../models/Payment.js';
import Booking from '../../models/Booking.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import { PAYMENT_STATUS } from '../../utils/constants.js';

// Mock payment provider
class MockPaymentProvider {
  async createIntent(amount, currency, metadata) {
    return {
      intentId: `intent_mock_${Date.now()}`,
      clientSecret: `secret_mock_${Date.now()}`,
      status: 'created',
    };
  }

  async capture(intentId) {
    return {
      paymentId: `pay_mock_${Date.now()}`,
      status: 'captured',
      capturedAt: new Date(),
    };
  }

  async cancel(intentId) {
    return {
      status: 'cancelled',
    };
  }

  async refund(paymentId, amount) {
    return {
      refundId: `refund_mock_${Date.now()}`,
      status: 'refunded',
      refundedAt: new Date(),
    };
  }
}

const paymentProvider = new MockPaymentProvider();

export const createPaymentIntent = async (userId, bookingId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new NotFoundError('Reserva no encontrada');
  }

  if (booking.driver.toString() !== userId) {
    throw new ForbiddenError('No tienes permiso para pagar esta reserva');
  }

  if (booking.payment) {
    const existingPayment = await Payment.findById(booking.payment);
    if (
      existingPayment &&
      [PAYMENT_STATUS.INTENT_CREATED, PAYMENT_STATUS.CAPTURED].includes(existingPayment.status)
    ) {
      throw new ValidationError('Ya existe un pago para esta reserva');
    }
  }

  const intent = await paymentProvider.createIntent(
    booking.pricing.total,
    booking.pricing.currency || 'USD',
    { bookingId }
  );

  const payment = await Payment.create({
    booking: bookingId,
    user: userId,
    amount: booking.pricing.total,
    currency: booking.pricing.currency || 'USD',
    status: PAYMENT_STATUS.INTENT_CREATED,
    intentId: intent.intentId,
    provider: 'mock',
    metadata: { clientSecret: intent.clientSecret },
  });

  booking.payment = payment._id;
  await booking.save();

  return {
    payment,
    clientSecret: intent.clientSecret,
  };
};

export const capturePayment = async (userId, paymentId) => {
  const payment = await Payment.findById(paymentId).populate('booking');

  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }

  if (payment.user.toString() !== userId) {
    throw new ForbiddenError('No tienes permiso para capturar este pago');
  }

  if (payment.status !== PAYMENT_STATUS.INTENT_CREATED) {
    throw new ValidationError('El pago no se puede capturar en su estado actual');
  }

  try {
    const result = await paymentProvider.capture(payment.intentId);

    payment.status = PAYMENT_STATUS.CAPTURED;
    payment.providerPaymentId = result.paymentId;
    payment.capturedAt = result.capturedAt;

    await payment.save();

    return payment;
  } catch (error) {
    payment.status = PAYMENT_STATUS.FAILED;
    payment.failedAt = new Date();
    payment.failureReason = error.message;

    await payment.save();

    throw error;
  }
};

export const cancelPayment = async (userId, paymentId) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }

  if (payment.user.toString() !== userId) {
    throw new ForbiddenError('No tienes permiso para cancelar este pago');
  }

  if (payment.status === PAYMENT_STATUS.CAPTURED) {
    throw new ValidationError('No se puede cancelar un pago ya capturado');
  }

  await paymentProvider.cancel(payment.intentId);

  payment.status = PAYMENT_STATUS.CANCELLED;

  await payment.save();

  return payment;
};

export const getPaymentById = async (userId, paymentId) => {
  const payment = await Payment.findById(paymentId).populate('booking');

  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }

  if (payment.user.toString() !== userId) {
    throw new ForbiddenError('No tienes permiso para ver este pago');
  }

  return payment;
};

export const getReceipt = async (userId, paymentId) => {
  const payment = await Payment.findById(paymentId)
    .populate({
      path: 'booking',
      populate: [
        { path: 'listing', select: 'title address' },
        { path: 'vehicle', select: 'plate make model' },
      ],
    })
    .populate('user', 'firstName lastName email');

  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }

  if (payment.user._id.toString() !== userId) {
    throw new ForbiddenError('No tienes permiso para ver este recibo');
  }

  return {
    payment,
    receiptNumber: `PARKBNB-${payment._id.toString().slice(-8).toUpperCase()}`,
    generatedAt: new Date(),
  };
};

export const getPaymentMethods = async (userId) => {
  // Mock: in production, integrate with Stripe/PayPal
  return [
    {
      id: 'pm_mock_1',
      type: 'card',
      brand: 'visa',
      last4: '4242',
      isDefault: true,
    },
  ];
};

export const addPaymentMethod = async (userId, methodData) => {
  // Mock: in production, integrate with Stripe/PayPal
  return {
    id: `pm_mock_${Date.now()}`,
    type: methodData.type,
    brand: methodData.brand,
    last4: methodData.last4,
    isDefault: false,
  };
};

export const deletePaymentMethod = async (userId, methodId) => {
  // Mock: in production, integrate with Stripe/PayPal
  return { success: true };
};

