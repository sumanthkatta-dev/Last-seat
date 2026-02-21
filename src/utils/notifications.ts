// Notification utility functions

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/bus-icon.png',
        badge: '/bus-icon.png',
        ...options,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
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
