import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, {
  AuthorizationStatus,
  AndroidImportance,
  AndroidStyle,
  Notification,
} from '@notifee/react-native';
import {Platform} from 'react-native';

export interface NotificationData {
  orderId?: string;
  fabricId?: string;
}

export type RemoteMessage = FirebaseMessagingTypes.RemoteMessage | null;

const ChannelId = 'com.bytelearn';
const ChannelName = 'Bytelearn Notification';
const {AUTHORIZED, PROVISIONAL} = messaging.AuthorizationStatus;
export const grantedStatuses = [AUTHORIZED, PROVISIONAL];

// 👉 Check for permission. If not granted, asked for permission
export async function checkNotificationPermission() {
  const settings = await notifee.requestPermission();
  const isEnabled =
    settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  return isEnabled;
}

// 👉 Generate firebase device token
export async function getDeviceToken() {
  const token = await messaging().getToken();
  console.log(`FCM token -> ${token}`);
  return token;
}

//👉 Android notification channel
export async function createChannelIfNotExist() {
  try {
    const isAlreadyExist = await notifee.isChannelCreated(ChannelId);

    if (isAlreadyExist) {
      const channelId = await notifee.getChannel(ChannelId);
      return channelId;
    }

    const channelId = await notifee.createChannel({
      id: ChannelId,
      name: ChannelName,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [50, 100],
    });

    return channelId;
  } catch (error) {
    console.log(`Error while creating channel`);
  }
}

//👉 Get notification payload
export function getDisplayNotificationPayload(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Notification {
  const messageId = remoteMessage.messageId;
  const notification = remoteMessage.notification;

  if (Platform.OS === 'ios') {
    return {
      id: messageId,
      title: notification?.title,
      body: notification?.body,
      ios: {
        sound: 'default',
      },
    };
  }

  return {
    title: notification?.title,
    body: notification?.body,
    android: {
      channelId: ChannelId,
      color: '#222222',
      colorized: true,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [500, 100],
      pressAction: {
        id: 'default',
      },
      fullScreenAction: {
        id: 'default',
      },
      style: {type: AndroidStyle.BIGTEXT, text: notification?.body || ''},
    },
  };
}
