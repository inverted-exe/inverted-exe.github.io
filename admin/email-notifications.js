// ============================================
// EMAIL NOTIFICATIONS SYSTEM
// Send email notifications for orders and payments
// ============================================

// Email Configuration - Firebase Cloud Functions Integration
const EMAIL_CONFIG = {
  serviceName: 'inverted.exe',
  senderEmail: 'noreply@inverted.exe',
  senderName: 'inverted.exe',
  supportEmail: 'support@inverted.exe',
  // Firebase Cloud Functions endpoint for sending emails
  firebaseFunctionUrl: 'https://your-firebase-project.cloudfunctions.net/sendEmail'
};

// ============================================
// EMAIL QUEUE SYSTEM
// ============================================

let emailQueue = [];

function addToEmailQueue(email) {
  emailQueue.push({
    ...email,
    queuedAt: new Date().toISOString(),
    status: 'queued',
    retries: 0
  });
  
  console.log(`📧 Email queued: ${email.to} - ${email.subject}`);
  
  // Auto-send if not in mock mode
  if (!EMAIL_CONFIG.mockMode) {
    processEmailQueue();
  }
}

async function processEmailQueue() {
  while (emailQueue.length > 0) {
    const email = emailQueue.shift();
    const result = await sendEmail(email);
    
    if (!result.success && email.retries < 3) {
      email.retries++;
      emailQueue.push(email);
    }
  }
}

// ============================================
// MAIN EMAIL SENDER - Firebase Cloud Functions
// ============================================

async function sendEmail(emailData) {
  try {
    // Send to Firebase Cloud Function
    const response = await fetch(EMAIL_CONFIG.firebaseFunctionUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (await getFirebaseAuthToken())
      },
      body: JSON.stringify({
        to: emailData.to,
        subject: emailData.subject,
        htmlBody: emailData.htmlBody,
        type: emailData.type,
        orderId: emailData.orderId,
        customerName: emailData.customerName
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const result = await response.json();
    console.log('✅ Email sent:', emailData.to);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Email sending error:', error);
    return { success: false, error: error.message };
  }
}

// Get Firebase auth token for API calls
async function getFirebaseAuthToken() {
  const user = firebase.auth().currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
}

// ============================================
// ORDER CONFIRMATION EMAIL
// ============================================

function sendOrderConfirmationEmail(order) {
  const subject = `Order Confirmation - Order #${order.id}`;
  
  const emailBody = generateOrderConfirmationEmail(order);
  
  addToEmailQueue({
    to: order.customerEmail,
    subject: subject,
    type: 'order_confirmation',
    body: emailBody,
    orderId: order.id,
    customerName: order.customerName,
    htmlBody: emailBody
  });
}

function generateOrderConfirmationEmail(order) {
  const orderUrl = `${window.location.origin}/order-status/${order.id}`;
  const itemsHtml = order.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; }
        .footer { background: #333; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; font-weight: bold; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Thank You for Your Order!</h2>
        </div>
        <div class="content">
          <p>Hi ${order.customerName},</p>
          
          <p>We've received your order and we're processing it right away.</p>
          
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleString()}</p>
          
          <h3>Items Ordered</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; text-align: right;">
            <h3>Total: $${order.total.toFixed(2)}</h3>
          </div>
          
          <p><a href="${orderUrl}" class="button">Track Your Order</a></p>
          
          <h3>What's Next?</h3>
          <ul>
            <li>We'll send you a shipping confirmation email when your order ships</li>
            <li>You can track your order using the link above</li>
            <li>If you have any questions, contact us at ${EMAIL_CONFIG.supportEmail}</li>
          </ul>
          
          <p>Best regards,<br><strong>${EMAIL_CONFIG.serviceName}</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.serviceName}. All rights reserved.</p>
          <p><a href="https://inverted.exe" style="color: white;">Visit our website</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// PAYMENT CONFIRMATION EMAIL
// ============================================

function sendPaymentConfirmationEmail(order, paymentResult) {
  const subject = `Payment Received - Order #${order.id}`;
  
  const emailBody = generatePaymentConfirmationEmail(order, paymentResult);
  
  addToEmailQueue({
    to: order.customerEmail,
    subject: subject,
    type: 'payment_confirmation',
    body: emailBody,
    orderId: order.id,
    paymentId: paymentResult.transactionId,
    htmlBody: emailBody
  });
}

function generatePaymentConfirmationEmail(order, paymentResult) {
  return `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .success-box { background: #d1e7dd; border: 2px solid #0f5132; padding: 20px; border-radius: 8px; color: #0f5132; }
        .success-icon { font-size: 48px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-box">
          <div class="success-icon">✓</div>
          <h2>Payment Confirmed!</h2>
          <p>We've successfully received your payment.</p>
        </div>
        
        <h3 style="margin-top: 30px;">Payment Details</h3>
        <table>
          <tr>
            <td><strong>Transaction ID:</strong></td>
            <td>${paymentResult.transactionId}</td>
          </tr>
          <tr>
            <td><strong>Amount:</strong></td>
            <td>$${paymentResult.amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>Payment Method:</strong></td>
            <td>${order.paymentMethod.replace(/_/g, ' ').toUpperCase()}</td>
          </tr>
          <tr>
            <td><strong>Date & Time:</strong></td>
            <td>${new Date(paymentResult.timestamp).toLocaleString()}</td>
          </tr>
        </table>
        
        <h3>Order #${order.id}</h3>
        <p>Your payment has been processed and your order is being prepared for shipment.</p>
        
        <div style="background: #cfe2ff; padding: 15px; border-radius: 8px; border-left: 4px solid #084298; color: #084298;">
          <strong>Next Step:</strong> You'll receive a shipping notification with tracking information within 24 hours.
        </div>
        
        <p style="margin-top: 30px;">Thank you for your business!</p>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// REFUND NOTIFICATION EMAIL
// ============================================

function sendRefundNotificationEmail(order, refundResult) {
  const subject = `Refund Processed - Order #${order.id}`;
  
  const emailBody = generateRefundEmail(order, refundResult);
  
  addToEmailQueue({
    to: order.customerEmail,
    subject: subject,
    type: 'refund_notification',
    body: emailBody,
    orderId: order.id,
    refundId: refundResult.refundId,
    htmlBody: emailBody
  });
}

function generateRefundEmail(order, refundResult) {
  return `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .info-box { background: #cfe2ff; border: 2px solid #084298; padding: 20px; border-radius: 8px; color: #084298; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="info-box">
          <h2>Refund Processed</h2>
          <p>Your refund has been processed successfully.</p>
        </div>
        
        <h3 style="margin-top: 30px;">Refund Details</h3>
        <p><strong>Order ID:</strong> #${order.id}</p>
        <p><strong>Refund ID:</strong> ${refundResult.refundId}</p>
        <p><strong>Refund Amount:</strong> $${refundResult.amount.toFixed(2)}</p>
        <p><strong>Reason:</strong> ${order.refundReason || 'Not specified'}</p>
        <p><strong>Processed At:</strong> ${new Date(order.refundedAt).toLocaleString()}</p>
        
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          Please allow 3-5 business days for the refund to appear in your account, depending on your bank.
        </p>
        
        <p>If you have any questions about this refund, please contact us at ${EMAIL_CONFIG.supportEmail}</p>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// ORDER STATUS UPDATE EMAIL
// ============================================

function sendOrderStatusUpdateEmail(order, newStatus) {
  const subject = `Order Status Updated - Order #${order.id}`;
  
  const emailBody = generateStatusUpdateEmail(order, newStatus);
  
  addToEmailQueue({
    to: order.customerEmail,
    subject: subject,
    type: 'status_update',
    body: emailBody,
    orderId: order.id,
    newStatus: newStatus,
    htmlBody: emailBody
  });
}

function generateStatusUpdateEmail(order, newStatus) {
  const statusMessages = {
    pending: 'Your order is pending and will be processed shortly.',
    processing: 'Your order is being prepared for shipment.',
    completed: 'Your order has been shipped! Check your tracking information.',
    cancelled: 'Your order has been cancelled.'
  };

  return `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .status-badge { display: inline-block; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 15px 0; }
        .status-processing { background: #cfe2ff; color: #084298; }
        .status-completed { background: #d1e7dd; color: #0f5132; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-cancelled { background: #f8d7da; color: #842029; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Order Status Update</h2>
        
        <p>Hi ${order.customerName},</p>
        
        <p>Your order status has been updated:</p>
        
        <div class="status-badge status-${newStatus}">
          ${newStatus.toUpperCase()}
        </div>
        
        <p>${statusMessages[newStatus]}</p>
        
        <p><strong>Order ID:</strong> #${order.id}</p>
        <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleString()}</p>
        
        ${newStatus === 'completed' ? `
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>Tracking Information:</strong>
            <p>Your order is on its way! You should receive it within 3-5 business days.</p>
            <p>Track your package: [Tracking URL will be provided separately]</p>
          </div>
        ` : ''}
        
        <p>If you have any questions, please don't hesitate to contact us at ${EMAIL_CONFIG.supportEmail}</p>
        
        <p>Thank you for shopping with ${EMAIL_CONFIG.serviceName}!</p>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// ADMIN NOTIFICATION EMAILS
// ============================================

function sendAdminNewOrderNotification(order) {
  const subject = `[ADMIN] New Order Received - Order #${order.id}`;
  
  const emailBody = `
    <h2>New Order Received</h2>
    <p>A new order has been placed:</p>
    <p><strong>Order ID:</strong> #${order.id}</p>
    <p><strong>Customer:</strong> ${order.customerName} (${order.customerEmail})</p>
    <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
    <p><strong>Items:</strong> ${order.items.length} item(s)</p>
    <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
    <p><a href="${window.location.origin}/admin#orders">View Order in Admin Panel</a></p>
  `;
  
  addToEmailQueue({
    to: EMAIL_CONFIG.supportEmail,
    subject: subject,
    type: 'admin_notification',
    body: emailBody,
    orderId: order.id,
    htmlBody: emailBody
  });
}

// ============================================
// EMAIL QUEUE MANAGEMENT
// ============================================

function viewEmailQueue() {
  console.log('📧 Email Queue:', emailQueue);
  return emailQueue;
}

function viewSentEmails() {
  const sentEmails = JSON.parse(localStorage.getItem('sent_emails') || '[]');
  console.log('📧 Sent Emails:', sentEmails);
  return sentEmails;
}

function clearEmailQueue() {
  emailQueue = [];
  console.log('✓ Email queue cleared');
}

function clearSentEmails() {
  localStorage.removeItem('sent_emails');
  console.log('✓ Sent emails cleared');
}

// ============================================
// EMAIL PREFERENCES
// ============================================

const EMAIL_PREFERENCES = {
  orderConfirmation: true,
  paymentConfirmation: true,
  statusUpdates: true,
  promotions: true,
  newsletters: true
};

function updateEmailPreference(prefKey, value) {
  EMAIL_PREFERENCES[prefKey] = value;
  localStorage.setItem('email_preferences', JSON.stringify(EMAIL_PREFERENCES));
  console.log(`Email preference updated: ${prefKey} = ${value}`);
}

function getEmailPreferences() {
  const stored = localStorage.getItem('email_preferences');
  return stored ? JSON.parse(stored) : EMAIL_PREFERENCES;
}
