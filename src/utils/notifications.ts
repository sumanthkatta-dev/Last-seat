// Notification utility functions

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('ℹ️ This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Notifications already enabled');
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        return true;
      } else {
        console.log('❌ Notification permission denied by user');
        return false;
      }
    } catch (error) {
      console.log('⚠️ Notification permission request failed:', error);
      return false;
    }
  }

  console.log('❌ Notifications are blocked in browser settings');
  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }
  
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/bus-icon.png',
        badge: '/bus-icon.png',
        ...options,
      });
      console.log('📬 Notification sent:', title);
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  } else {
    console.log('⚠️ Cannot send notification - permission not granted');
  }
};

export const sendBusArrivalNotification = (stopName: string, eta: number) => {
  sendNotification('🚌 Bus Update', {
    body: `Bus arriving at ${stopName} in ${eta} minutes`,
    tag: 'bus-arrival',
    requireInteraction: false,
  });
};

export const sendBusApproachingNotification = (stopName: string) => {
  sendNotification('🚌 Bus Approaching!', {
    body: `Bus is approaching ${stopName}. Get ready!`,
    tag: 'bus-approaching',
    requireInteraction: true,
  });
};

export const sendJourneyStartNotification = () => {
  sendNotification('🚌 Journey Started', {
    body: 'Your bus has started its journey. Track it in real-time!',
    tag: 'journey-start',
  });
};

export const sendJourneyEndNotification = () => {
  sendNotification('🚌 Journey Completed', {
    body: 'The bus has completed its journey.',
    tag: 'journey-end',
  });
};
