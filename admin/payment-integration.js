// ============================================
// PAYMENT INTEGRATION MODULE
// Stripe & PayPal Integration for Orders (PRODUCTION)
// ============================================

// Payment Configuration - SET YOUR REAL API KEYS HERE
const PAYMENT_CONFIG = {
  stripe: {
    publicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_live_YOUR_PUBLIC_KEY',
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_live_YOUR_SECRET_KEY',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    enabled: true // Stripe is enabled by default
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID',
    secretKey: process.env.PAYPAL_SECRET_KEY || 'YOUR_PAYPAL_SECRET_KEY',
    apiUrl: 'https://api.paypal.com', // Production URL
    enabled: true // PayPal is enabled by default
  },
  bankTransfer: {
    enabled: true, // For manual bank transfers
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
    routingNumber: process.env.BANK_ROUTING_NUMBER || '',
    accountName: process.env.BANK_ACCOUNT_NAME || 'inverted.exe'
  }
};

// ============================================
// PAYMENT METHODS
// ============================================

const PAYMENT_METHODS = [
  { id: 'credit_card', name: 'Credit Card', icon: 'ri-bank-card-line', provider: 'stripe' },
  { id: 'paypal', name: 'PayPal', icon: 'ri-paypal-line', provider: 'paypal' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: 'ri-bank-line', provider: 'local' },
  { id: 'cash', name: 'Cash on Delivery', icon: 'ri-money-dollar-circle-line', provider: 'local' }
];

// ============================================
// PAYMENT PROCESSING
// ============================================

// Process payment
async function processPayment(orderId, paymentMethod, paymentDetails = {}) {
  try {
    const order = adminData.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    console.log(`Processing payment for Order #${orderId} with ${paymentMethod}`);

    let paymentResult = { success: false };

    // Route to appropriate payment processor
    switch (paymentMethod) {
      case 'credit_card':
        paymentResult = await processStripePayment(order, paymentDetails);
        break;
      case 'paypal':
        paymentResult = await processPayPalPayment(order, paymentDetails);
        break;
      case 'bank_transfer':
        paymentResult = await processBankTransfer(order);
        break;
      case 'cash':
        paymentResult = processLocalPayment(order, 'cash');
        break;
      default:
        throw new Error('Unknown payment method');
    }

    // Update order if payment successful
    if (paymentResult.success) {
      order.paymentStatus = 'paid';
      order.paymentMethod = paymentMethod;
      order.paymentId = paymentResult.transactionId;
      order.paidAt = new Date().toISOString();
      
      saveData();
      
      // Send confirmation email
      sendOrderConfirmationEmail(order);
      
      // Send payment confirmation email
      sendPaymentConfirmationEmail(order, paymentResult);
      
      showNotification(`Payment received! Order #${orderId} confirmed.`, 'success');
      return paymentResult;
    } else {
      throw new Error(paymentResult.error || 'Payment processing failed');
    }

  } catch (error) {
    console.error('Payment error:', error);
    showNotification(`Payment failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// ============================================
// STRIPE PAYMENT PROCESSING
// ============================================

async function processStripePayment(order, cardDetails) {
  if (!PAYMENT_CONFIG.stripe.enabled) {
    throw new Error('Stripe is not configured');
  }

  try {
    // Use Stripe API via Firebase Cloud Function
    const response = await fetch(
      'https://your-firebase-project.cloudfunctions.net/processStripePayment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (await getFirebaseAuthToken())
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: Math.round(order.total * 100), // Stripe uses cents
          currency: 'USD',
          customer: {
            name: order.customerName,
            email: order.customerEmail
          },
          description: `Order #${order.id} - inverted.exe`
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment processing failed');
    }

    const result = await response.json();
    
    return {
      success: true,
      provider: 'stripe',
      transactionId: result.paymentIntentId,
      amount: order.total,
      currency: 'USD',
      status: result.status,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Stripe payment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// PAYPAL PAYMENT PROCESSING
// ============================================

async function processPayPalPayment(order, paypalDetails = {}) {
  if (!PAYMENT_CONFIG.paypal.enabled) {
    throw new Error('PayPal is not configured');
  }

  try {
    // Use PayPal API via Firebase Cloud Function
    const response = await fetch(
      'https://your-firebase-project.cloudfunctions.net/processPayPalPayment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (await getFirebaseAuthToken())
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.total,
          currency: 'USD',
          customer: {
            name: order.customerName,
            email: order.customerEmail
          },
          description: `Order #${order.id} - inverted.exe`
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment processing failed');
    }

    const result = await response.json();
    
    return {
      success: true,
      provider: 'paypal',
      transactionId: result.transactionId,
      amount: order.total,
      currency: 'USD',
      status: result.status,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// BANK TRANSFER PAYMENT
// ============================================

function processBankTransfer(order) {
  const transactionId = 'bank_' + generateUUID();
  
  return {
    success: true,
    provider: 'bank_transfer',
    transactionId: transactionId,
    amount: order.total,
    currency: 'USD',
    status: 'pending_verification', // Needs bank confirmation
    bankDetails: {
      accountName: PAYMENT_CONFIG.bankTransfer.accountName,
      accountNumber: PAYMENT_CONFIG.bankTransfer.accountNumber,
      routingNumber: PAYMENT_CONFIG.bankTransfer.routingNumber,
      reference: `INV-${order.id}`
    },
    timestamp: new Date().toISOString(),
    message: `Please transfer $${order.total} with reference: INV-${order.id}`
  };
}

function processLocalPayment(order, method) {
  const transactionId = method + '_' + generateUUID();
  
  return {
    success: true,
    provider: 'local',
    transactionId: transactionId,
    amount: order.total,
    currency: 'USD',
    status: 'completed',
    method: method,
    timestamp: new Date().toISOString(),
    note: method === 'cash' ? 'Payment to be collected on delivery' : 'Local payment processed'
  };
}

// ============================================
// PAYMENT VERIFICATION
// ============================================

// Verify payment with provider (webhook handler)
async function verifyPaymentWebhook(webhookData) {
  try {
    console.log('Verifying payment webhook:', webhookData);

    // Find order by transaction ID
    const order = adminData.orders.find(o => o.paymentId === webhookData.transactionId);
    if (!order) {
      console.error('Order not found for transaction:', webhookData.transactionId);
      return false;
    }

    // Update payment status based on webhook
    if (webhookData.status === 'completed' || webhookData.status === 'paid') {
      order.paymentStatus = 'paid';
      saveData();
      console.log(`Payment verified for Order #${order.id}`);
      return true;
    } else if (webhookData.status === 'failed' || webhookData.status === 'cancelled') {
      order.paymentStatus = 'failed';
      saveData();
      console.log(`Payment failed for Order #${order.id}`);
      return false;
    }

  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
}

// ============================================
// REFUND PROCESSING
// ============================================

async function processRefund(orderId, refundReason = '') {
  try {
    const order = adminData.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    if (order.paymentStatus !== 'paid') {
      throw new Error('Order has not been paid');
    }

    console.log(`Processing refund for Order #${orderId}:`, refundReason);

    let refundResult;

    // Route to appropriate refund processor
    if (order.paymentMethod === 'credit_card' && order.paymentId.startsWith('stripe_')) {
      refundResult = await processStripeRefund(order);
    } else if (order.paymentMethod === 'paypal' && order.paymentId.startsWith('paypal_')) {
      refundResult = await processPayPalRefund(order);
    } else {
      // Local payments
      refundResult = {
        success: true,
        refundId: 'refund_' + generateUUID(),
        amount: order.total,
        status: 'completed'
      };
    }

    if (refundResult.success) {
      order.paymentStatus = 'refunded';
      order.refundId = refundResult.refundId;
      order.refundReason = refundReason;
      order.refundedAt = new Date().toISOString();
      order.status = 'cancelled';
      
      saveData();
      
      // Send refund email
      sendRefundNotificationEmail(order, refundResult);
      
      showNotification(`Refund processed for Order #${orderId}`, 'success');
      return refundResult;
    } else {
      throw new Error(refundResult.error || 'Refund failed');
    }

  } catch (error) {
    console.error('Refund error:', error);
    showNotification(`Refund failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function processStripeRefund(order) {
  // Simulate Stripe refund
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    success: true,
    refundId: 'stripe_refund_' + generateUUID(),
    amount: order.total,
    status: 'completed'
  };
}

async function processPayPalRefund(order) {
  // Simulate PayPal refund
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    success: true,
    refundId: 'paypal_refund_' + generateUUID(),
    amount: order.total,
    status: 'completed'
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getPaymentMethodInfo(methodId) {
  return PAYMENT_METHODS.find(m => m.id === methodId);
}

function getPaymentStatus(status) {
  const statuses = {
    'unpaid': { label: 'Unpaid', color: 'warning', icon: 'ri-time-line' },
    'paid': { label: 'Paid', color: 'success', icon: 'ri-check-line' },
    'failed': { label: 'Failed', color: 'danger', icon: 'ri-close-line' },
    'refunded': { label: 'Refunded', color: 'info', icon: 'ri-undo-line' },
    'pending': { label: 'Pending', color: 'warning', icon: 'ri-timer-line' }
  };
  return statuses[status] || statuses['unpaid'];
}

// ============================================
// PAYMENT UI HELPERS
// ============================================

function renderPaymentMethodSelection() {
  return `
    <div class="payment-methods">
      <label>Select Payment Method</label>
      <div class="payment-grid">
        ${PAYMENT_METHODS.map(method => `
          <div class="payment-option" onclick="selectPaymentMethod('${method.id}')">
            <div class="payment-icon">
              <i class="${method.icon}"></i>
            </div>
            <div class="payment-name">${method.name}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderPaymentForm(methodId) {
  const method = getPaymentMethodInfo(methodId);
  
  if (methodId === 'credit_card') {
    return `
      <div class="payment-form">
        <h4>Credit Card Details</h4>
        <input type="text" placeholder="Cardholder Name" class="form-input" id="cardName" required>
        <input type="text" placeholder="Card Number (XXXX-XXXX-XXXX-XXXX)" class="form-input" id="cardNumber" required>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <input type="text" placeholder="MM/YY" class="form-input" id="cardExpiry" required>
          <input type="text" placeholder="CVV" class="form-input" id="cardCVV" required>
        </div>
      </div>
    `;
  } else if (methodId === 'paypal') {
    return `
      <div class="payment-form">
        <h4>PayPal Payment</h4>
        <p>You will be redirected to PayPal to complete the payment.</p>
        <input type="email" placeholder="PayPal Email" class="form-input" id="paypalEmail" required>
      </div>
    `;
  } else if (methodId === 'bank_transfer') {
    return `
      <div class="payment-form">
        <h4>Bank Transfer Details</h4>
        <p>Transfer the order amount to the following account:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Account Name:</strong> inverted.exe</p>
          <p><strong>Account Number:</strong> [Your Account Number]</p>
          <p><strong>Bank Name:</strong> [Your Bank Name]</p>
          <p><strong>Reference:</strong> INV-[Order ID]</p>
        </div>
        <p style="color: #666; font-size: 12px;">Please keep the reference for verification.</p>
      </div>
    `;
  } else if (methodId === 'cash') {
    return `
      <div class="payment-form">
        <h4>Cash on Delivery</h4>
        <p>Payment will be collected when your order is delivered.</p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; color: #856404;">
          <i class="ri-alert-line"></i> Please have exact change ready.
        </div>
      </div>
    `;
  }
  
  return '';
}

// CSS for payment UI
const paymentStyles = document.createElement('style');
paymentStyles.textContent = `
  .payment-methods {
    margin: 20px 0;
  }

  .payment-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 15px;
    margin-top: 15px;
  }

  .payment-option {
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .payment-option:hover {
    border-color: #4CAF50;
    background: #f9f9f9;
  }

  .payment-option.selected {
    border-color: #4CAF50;
    background: #e8f5e9;
  }

  .payment-icon {
    font-size: 32px;
    margin-bottom: 10px;
    color: #4CAF50;
  }

  .payment-name {
    font-size: 14px;
    font-weight: 500;
  }

  .payment-form {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    margin: 15px 0;
  }

  .payment-form h4 {
    margin-top: 0;
  }

  .payment-status {
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }

  .payment-status.unpaid {
    background: #fff3cd;
    color: #856404;
  }

  .payment-status.paid {
    background: #d1e7dd;
    color: #0f5132;
  }

  .payment-status.failed {
    background: #f8d7da;
    color: #842029;
  }

  .payment-status.refunded {
    background: #cfe2ff;
    color: #084298;
  }
`;
if (document.head) {
  document.head.appendChild(paymentStyles);
}
