"use server";

import { createClient } from "@/utils/supabase/server";
import { db } from ".";
import { 
  customers, 
  userPreferences, 
  users, 
  landlords, 
  properties, 
  propertyListings,
  apartmentBuildings,
  conversationParticipants,
  messages,
  groupInvitations,
  renters,
  likedProperties,
  notifications
} from "./schema";
import { eq, or } from "drizzle-orm";
import { createAdminClient } from "@/utils/supabase/admin";
import { NotificationPreferences } from "@/lib/types";

/**
 * Issues a request to change the user's name in the database.
 * Note: user must be authenticated.
 */
export const changeName = async (firstName: string, lastName: string) => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    await db
      .update(customers)
      .set({
        firstName,
        lastName
      })
      .where(eq(customers.userId, data.user.id));

    return {
      success: true
    };
  } catch (error) {
    console.error("Error changing name:", error);
    return {
      success: false,
      error: "Failed to change name"
    };
  }
};

/**
 * Issues a request to change the user's username in the database.
 * Note: user must be authenticated.
 */
export const changeUsername = async (username: string) => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    await db
      .update(users)
      .set({
        username
      })
      .where(eq(users.id, data.user.id));

    return {
      success: true
    };
  } catch (error) {
    console.error("Error changing username:", error);
    return {
      success: false,
      error: "Failed to change username"
    };
  }
};

/**
 * Sends confirmation emails to the user's old and new email addresses
 *  to verify the change.
 *
 * Note: user must be authenticated.
 */
export const changeEmail = async (email: string) => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      email
    });

    if (updateError) {
      return {
        success: false,
        error: updateError.message
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error("Error changing email:", error);
    return {
      success: false,
      error: "Failed to change email"
    };
  }
};

/**
 * Updates the user's password.
 * Note: user must be authenticated.
 */
export const changePassword = async (newPassword: string) => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      return {
        success: false,
        error: updateError.message
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      success: false,
      error: "Failed to change password"
    };
  }
};

/**
 * Starts enrollment for two-factor authentication (2FA).
 * Note: user must be authenticated.
 */
export const enrollTwoFactor = async () => {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    // if user already has a factorId, unenroll it first
    const user = await db.query.users.findFirst({
      where: eq(users.id, userData.user.id),
      columns: { factorId: true }
    });
    if (user && user.factorId) {
      await supabase.auth.mfa.unenroll({ factorId: user.factorId });
    }

    // enroll new TOTP factor
    const { data: mfaData, error: mfaError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Rentora"
    });
    if (mfaError) {
      return {
        success: false,
        error: mfaError.message
      };
    }

    // store factorId in the database
    await db
      .update(users)
      .set({ factorId: mfaData.id })
      .where(eq(users.id, userData.user.id));

    return {
      success: true,
      factorId: mfaData.id,
      totp: mfaData.totp
    };
  } catch (error) {
    console.error("Error enrolling two-factor authentication:", error);
    return {
      success: false,
      error: "Failed to enroll two-factor authentication"
    };
  }
};

export const verifyTwoFactor = async (code: string) => {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    // get factorId
    const user = await db.query.users.findFirst({
      where: eq(users.id, userData.user.id),
      columns: { factorId: true }
    });
    if (!user || !user.factorId) {
      return {
        success: false,
        error: "Two-factor authentication not enrolled"
      };
    }

    // verify the TOTP code
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: user.factorId,
      code
    });

    if (verifyError) {
      return {
        success: false,
        error: verifyError.message
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error("Error verifying two-factor authentication:", error);
    return {
      success: false,
      error: "Failed to verify two-factor authentication"
    };
  }
};

/**
 * Disables two-factor authentication for the user.
 * Note: user must be authenticated.
 */
export const unenrollTwoFactor = async () => {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    // get factorId
    const user = await db.query.users.findFirst({
      where: eq(users.id, userData.user.id),
      columns: { factorId: true }
    });
    if (!user || !user.factorId) {
      return {
        success: false,
        error: "Two-factor authentication not enrolled"
      };
    }

    const { error: mfaError } = await supabase.auth.mfa.unenroll({
      factorId: user.factorId
    });
    if (mfaError) {
      return {
        success: false,
        error: mfaError.message
      };
    }

    // remove factorId from the database
    await db
      .update(users)
      .set({ factorId: null })
      .where(eq(users.id, userData.user.id));

    return {
      success: true
    };
  } catch (error) {
    console.error("Error disabling two-factor authentication:", error);
    return {
      success: false,
      error: "Failed to disable two-factor authentication"
    };
  }
};

/**
 * Returns whether the user has two-factor authentication enabled.
 * Note: user must be authenticated.
 */
export const getMFAStatus = async () => {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    const { data, error } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    const hasMFA = data.nextLevel === "aal2";

    return {
      success: true,
      hasMFA
    };
  } catch (error) {
    console.error("Error getting MFA status:", error);
    return {
      success: false,
      error: "Failed to get MFA status"
    };
  }
};

/**
 * Deletes the user's account and all associated data.
 * Note: user must be authenticated.
 */
export const deleteAccount = async () => {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    const userId = data.user.id;

    // Step 1: Get customer ID to find associated landlord/renter profiles
    const customerRecord = await db.query.customers.findFirst({
      where: eq(customers.userId, userId),
      columns: { id: true }
    });

    if (customerRecord) {
      // Step 2: Delete landlord-related data first (since it has the most dependencies)
      const landlordRecord = await db.query.landlords.findFirst({
        where: eq(landlords.customerId, customerRecord.id),
        columns: { id: true }
      });

      if (landlordRecord) {
        console.log(`Deleting landlord data for user ${userId}`);
        
        // Get all properties owned by this landlord
        const userProperties = await db.query.properties.findMany({
          where: eq(properties.landlordId, landlordRecord.id),
          columns: { id: true }
        });

        // Delete property listings for each property (explicit deletion for clarity)
        for (const property of userProperties) {
          await db.delete(propertyListings)
            .where(eq(propertyListings.propertyId, property.id));
        }

        // Delete properties (this will cascade delete property_images, property_features, etc.)
        await db.delete(properties)
          .where(eq(properties.landlordId, landlordRecord.id));

        // Delete apartment buildings owned by this landlord
        await db.delete(apartmentBuildings)
          .where(eq(apartmentBuildings.landlordId, landlordRecord.id));

        // Delete landlord record
        await db.delete(landlords)
          .where(eq(landlords.id, landlordRecord.id));
      }

      // Step 3: Delete renter profile if exists
      const renterRecord = await db.query.renters.findFirst({
        where: eq(renters.customerId, customerRecord.id),
        columns: { id: true }
      });

      if (renterRecord) {
        console.log(`Deleting renter data for user ${userId}`);
        
        // Note: propertyViews and renterSearches will be cleaned up 
        // when the renterId becomes null (they reference renters.id)
        await db.delete(renters)
          .where(eq(renters.id, renterRecord.id));
      }
    }

    // Step 4: Delete user-related data
    console.log(`Deleting user-related data for user ${userId}`);
    
    // Delete notifications sent to or by this user
    await db.delete(notifications)
      .where(or(
        eq(notifications.senderId, userId),
        eq(notifications.receiverId, userId)
      ));

    // Delete user preferences
    await db.delete(userPreferences)
      .where(eq(userPreferences.userId, userId));

    // Note: oneTapApplicationPreferences references landlord.id, so it will be 
    // cleaned up when we delete the landlord profile (cascade delete)

    // Delete saved/liked properties
    await db.delete(likedProperties)
      .where(eq(likedProperties.userId, userId));
    
    // Note: savedProperties, propertyViews, renterSearches, and renterSearchPreferences
    // reference renter.id (not user.id directly), so they'll be cleaned up when we delete the renter profile

    // Delete renter searches and preferences (these actually reference renter.id, not user.id)
    // So they should be cleaned up automatically when the renter profile is deleted

    // Step 5: Handle messaging data
    console.log(`Deleting messaging data for user ${userId}`);
    
    // Get all conversations where user is a participant
    const userConversations = await db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.userId, userId),
      columns: { conversationId: true }
    });

    // Delete user's messages (soft delete may already be handled, but ensure cleanup)
    await db.delete(messages)
      .where(eq(messages.senderId, userId));

    // Delete group invitations sent by this user
    await db.delete(groupInvitations)
      .where(eq(groupInvitations.invitedBy, userId));

    // Remove user from conversation participants
    await db.delete(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId));

    // Step 6: Delete core user records
    console.log(`Deleting core user records for user ${userId}`);
    
    // Delete customer record (this should cascade to any remaining related data)
    if (customerRecord) {
      await db.delete(customers)
        .where(eq(customers.id, customerRecord.id));
    }

    // Delete user record
    await db.delete(users)
      .where(eq(users.id, userId));

    // Step 7: Delete user from Supabase auth (do this last)
    console.log(`Deleting user from Supabase auth: ${userId}`);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      return {
        success: false,
        error: deleteError.message
      };
    }

    console.log(`Successfully deleted user account: ${userId}`);
    return {
      success: true
    };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error: "Failed to delete account"
    };
  }
};

/**
 * Updates the user's notification preferences.
 * Note: user must be authenticated.
 */
export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
) => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    // Update preferences in the database
    await db
      .update(userPreferences)
      .set({
        ...preferences
      })
      .where(eq(userPreferences.userId, data.user.id));

    return {
      success: true
    };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return {
      success: false,
      error: "Failed to update notification preferences"
    };
  }
};
