import {useEffect, useState} from 'react';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, {Event, EventType} from '@notifee/react-native';
import {
  checkNotificationPermission,
  createChannelIfNotExist,
  getDeviceToken,
  getDisplayNotificationPayload,
} from './pushUtil';
import {Platform} from 'react-native';

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log(
    'Message handled in the background!',
    JSON.stringify(remoteMessage, null, 2),
  );
});

const PushNotification = () => {
  const [enabled, setEnabled] = useState(false);

  const handleNotification = (
    remoteMessage?: FirebaseMessagingTypes.RemoteMessage,
  ) => {
    if (!remoteMessage) {
      return;
    }
    console.log(remoteMessage);
  };

  async function handleNotifeePush(event: Event) {
    const {type, detail} = event;
    switch (type) {
      case EventType.DISMISSED:
        console.log('User dismissed notification', detail.notification);
        break;
      case EventType.PRESS:
        console.log('User pressed notification');
        handleNotification(
          detail.notification as FirebaseMessagingTypes.RemoteMessage,
        );
        break;
    }
  }

  useEffect(() => {
    (async () => {
      const isPermissionGiven = await checkNotificationPermission();
      if (isPermissionGiven) {
        if (Platform.OS === 'android') {
          await createChannelIfNotExist();
        }
        getDeviceToken();
      }
      setEnabled(isPermissionGiven);
    })();
  }, []);

  useEffect(() => {
    let notifeeForegroundUnsubscribe: null | (() => void) = null;
    if (!enabled) {
      return;
    }

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      try {
        console.log('[onMessage] notification received');
        const displayPayload = getDisplayNotificationPayload(remoteMessage);

        //generating local push notificaiton
        console.log(JSON.stringify({displayPayload}, null, 2));
        await notifee.displayNotification(displayPayload);
      } catch (error) {
        console.log(error);
      }
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.notification,
      );
      handleNotification(remoteMessage);
    });

    // Check whether an initial notification is available
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage.notification,
          );
          handleNotification(remoteMessage);
        }
      });

    notifeeForegroundUnsubscribe = notifee.onForegroundEvent(handleNotifeePush);
    notifee.onBackgroundEvent(handleNotifeePush);

    return () => {
      unsubscribe();
      if (notifeeForegroundUnsubscribe) {
        notifeeForegroundUnsubscribe();
      }
    };
  }, [enabled]);

  return null;
};

export default PushNotification;
