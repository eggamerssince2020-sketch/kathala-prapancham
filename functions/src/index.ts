import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

admin.initializeApp();

const db = admin.firestore();

// --- Corrected Function 1: Triggers when a user is followed ---
export const onFollowUser = onDocumentCreated("users/{userId}/followers/{followerId}", async (event) => {
  // The 'event' object contains all the context and data
  const { userId, followerId } = event.params;
  logger.info(`User ${followerId} started following ${userId}`);

  // Increment the 'followingCount' of the user who initiated the follow
  const followerRef = db.collection("users").doc(followerId);
  await followerRef.update({
    followingCount: admin.firestore.FieldValue.increment(1),
  });

  // Increment the 'followersCount' of the user who was followed
  const userRef = db.collection("users").doc(userId);
  await userRef.update({
    followersCount: admin.firestore.FieldValue.increment(1),
  });
});

// --- Corrected Function 2: Triggers when a user is unfollowed ---
export const onUnfollowUser = onDocumentDeleted("users/{userId}/followers/{followerId}", async (event) => {
  const { userId, followerId } = event.params;
  logger.info(`User ${followerId} unfollowed ${userId}`);

  // Decrement the 'followingCount' of the user who initiated the unfollow
  const followerRef = db.collection("users").doc(followerId);
  await followerRef.update({
    followingCount: admin.firestore.FieldValue.increment(-1),
  });

  // Decrement the 'followersCount' of the user who was unfollowed
  const userRef = db.collection("users").doc(userId);
  await userRef.update({
    followersCount: admin.firestore.FieldValue.increment(-1),
  });
});
