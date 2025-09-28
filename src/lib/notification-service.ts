import { db } from '@/src/db';
import { notifications, properties, landlords, customers, users, userPreferences } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';

export interface SublistingNotificationData {
  sublistingId: string;
  originalPropertyId: string;
  sublettingUserId: string;
  propertyAddress: string;
  monthlyRent?: number;
  availableDate?: string;
}

/**
 * Send notification to landlord when their property is sublisted
 */
export async function notifyLandlordOfSubletting(data: SublistingNotificationData) {
  try {
    console.log('🔔 Sending subletting notification for property:', data.originalPropertyId);

    // 1. Find the original property and its landlord
    const propertyResult = await db
      .select({
        landlordId: properties.landlordId,
        landlordCustomerId: landlords.customerId,
        landlordUserId: customers.userId,
        userEmail: users.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        propertyAddress: properties.addressLine1,
        propertyCity: properties.city,
        propertyState: properties.state,
      })
      .from(properties)
      .innerJoin(landlords, eq(properties.landlordId, landlords.id))
      .innerJoin(customers, eq(landlords.customerId, customers.id))
      .innerJoin(users, eq(customers.userId, users.id))
      .where(eq(properties.id, data.originalPropertyId))
      .limit(1);

    if (!propertyResult.length) {
      console.warn('⚠️ No landlord found for property:', data.originalPropertyId);
      return { success: false, error: 'Property or landlord not found' };
    }

    const landlordInfo = propertyResult[0];

    // Skip notification if the subletting user is the same as the property owner
    if (landlordInfo.landlordUserId === data.sublettingUserId) {
      console.log('👤 Skipping notification - user is subletting their own property');
      return { success: true, skipped: true, reason: 'self-subletting' };
    }

    // 2. Check landlord's notification preferences
    const preferencesResult = await db
      .select({
        sublettingNotificationsEmail: userPreferences.sublettingNotificationsEmail,
        sublettingNotificationsPush: userPreferences.sublettingNotificationsPush,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, landlordInfo.landlordUserId))
      .limit(1);

    const preferences = preferencesResult[0] || {
      sublettingNotificationsEmail: true, // Default to true if no preferences found
      sublettingNotificationsPush: true,
    };

    // 3. Create notification message
    const rentInfo = data.monthlyRent ? ` for $${data.monthlyRent}/month` : '';
    const availableInfo = data.availableDate ? ` starting ${new Date(data.availableDate).toLocaleDateString()}` : '';
    
    const message = `Your property at ${data.propertyAddress} has been listed for subletting${rentInfo}${availableInfo}. Review the subletting details and contact the subletter if needed.`;

    // 4. Send in-app notification (always send this)
    const [notification] = await db
      .insert(notifications)
      .values({
        senderId: data.sublettingUserId,
        receiverId: landlordInfo.landlordUserId,
        type: 'subletting',
        message,
      })
      .returning();

    console.log('✅ In-app notification created:', notification.id);

    // 5. Send email notification if enabled
    if (preferences.sublettingNotificationsEmail) {
      await sendSublettingEmailNotification({
        landlordEmail: landlordInfo.userEmail,
        landlordName: `${landlordInfo.firstName} ${landlordInfo.lastName}`,
        propertyAddress: data.propertyAddress,
        monthlyRent: data.monthlyRent,
        availableDate: data.availableDate,
        sublistingId: data.sublistingId,
      });
    }

    // 6. Send push notification if enabled
    if (preferences.sublettingNotificationsPush) {
      await sendSublettingPushNotification({
        userId: landlordInfo.landlordUserId,
        message,
        data: {
          type: 'subletting',
          sublistingId: data.sublistingId,
          propertyId: data.originalPropertyId,
        },
      });
    }

    return { 
      success: true, 
      notificationId: notification.id,
      emailSent: preferences.sublettingNotificationsEmail,
      pushSent: preferences.sublettingNotificationsPush,
      landlordInfo: {
        name: `${landlordInfo.firstName} ${landlordInfo.lastName}`,
        email: landlordInfo.userEmail,
      }
    };

  } catch (error) {
    console.error('❌ Error sending subletting notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email notification about subletting
 */
async function sendSublettingEmailNotification(data: {
  landlordEmail: string;
  landlordName: string;
  propertyAddress: string;
  monthlyRent?: number;
  availableDate?: string;
  sublistingId: string;
}) {
  try {
    console.log('📧 Sending subletting email to:', data.landlordEmail);
    
    // TODO: Integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll just log what would be sent
    const emailData = {
      to: data.landlordEmail,
      subject: '🏠 Your Property Has Been Listed for Subletting',
      template: 'subletting-notification',
      data: {
        landlordName: data.landlordName,
        propertyAddress: data.propertyAddress,
        monthlyRent: data.monthlyRent,
        availableDate: data.availableDate ? new Date(data.availableDate).toLocaleDateString() : null,
        viewSublistingUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sublisting/${data.sublistingId}`,
        managePropertiesUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sell/dashboard`,
        supportEmail: 'support@livaro.com',
      },
    };

    // Example email content that would be sent:
    console.log('📧 Email notification data:', {
      subject: emailData.subject,
      recipient: emailData.to,
      content: `
        Dear ${data.landlordName},

        We wanted to inform you that your property at ${data.propertyAddress} has been listed for subletting${data.monthlyRent ? ` at $${data.monthlyRent}/month` : ''}${data.availableDate ? ` starting ${emailData.data.availableDate}` : ''}.

        You can view the subletting details and contact the subletter through your dashboard:
        ${emailData.data.managePropertiesUrl}

        If you have any questions or concerns, please contact us at ${emailData.data.supportEmail}.

        Best regards,
        The Livaro Team
      `
    });

    // TODO: Replace with actual email service call
    // const response = await emailService.send(emailData);
    // console.log('✅ Email sent successfully:', response.id);

    return { success: true };

  } catch (error) {
    console.error('❌ Error sending subletting email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification about subletting
 */
async function sendSublettingPushNotification(data: {
  userId: string;
  message: string;
  data: Record<string, any>;
}) {
  try {
    console.log('📱 Sending subletting push notification to user:', data.userId);
    
    // TODO: Integrate with your push notification service (Firebase, OneSignal, etc.)
    const pushData = {
      userId: data.userId,
      title: '🏠 Property Subletting Alert',
      body: data.message,
      data: data.data,
      icon: '/logo.png',
      badge: '/logo.png',
    };

    // TODO: Replace with actual push service call
    // const response = await pushService.send(pushData);
    // console.log('✅ Push notification sent successfully:', response.id);

    console.log('📱 Push notification data:', pushData);
    return { success: true };

  } catch (error) {
    console.error('❌ Error sending subletting push notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all subletting notifications for a landlord
 */
export async function getSublettingNotifications(landlordUserId: string, limit: number = 50) {
  try {
    const result = await db
      .select({
        id: notifications.id,
        message: notifications.message,
        createdAt: notifications.createdAt,
        readAt: notifications.readAt,
        senderId: notifications.senderId,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.receiverId, landlordUserId),
          eq(notifications.type, 'subletting')
        )
      )
      .orderBy(notifications.createdAt)
      .limit(limit);

    return { success: true, notifications: result };
  } catch (error) {
    console.error('❌ Error fetching subletting notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark subletting notifications as read
 */
export async function markSublettingNotificationsAsRead(notificationIds: string[], userId: string) {
  try {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.receiverId, userId),
          eq(notifications.type, 'subletting'),
          // Add condition to only update the specified notification IDs
        )
      );

    return { success: true };
  } catch (error) {
    console.error('❌ Error marking subletting notifications as read:', error);
    return { success: false, error: error.message };
  }
}
