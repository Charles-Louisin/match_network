import { create } from 'zustand';

const useNotificationsStore = create((set) => ({
  unreadCount: 0,
  updateUnreadCount: (count) => set({ unreadCount: count }),
}));

export const useNotifications = () => {
  const { unreadCount, updateUnreadCount } = useNotificationsStore();

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/unread/count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erreur lors de la récupération du nombre de notifications non lues');
      
      const { count } = await response.json();
      updateUnreadCount(count);
      return count;
    } catch (error) {
      console.error('Erreur:', error);
      return 0;
    }
  };

  return {
    unreadCount,
    updateUnreadCount,
    fetchUnreadCount,
  };
};
