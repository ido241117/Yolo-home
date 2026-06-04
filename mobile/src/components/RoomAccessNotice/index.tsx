import { Text, View } from 'react-native';
import { styles } from '../../styles/app.styles';

interface RoomAccessNoticeProps {
  message?: string;
}

export default function RoomAccessNotice({ message = 'Bạn chưa thuộc phòng nào hết' }: RoomAccessNoticeProps) {
  return (
    <View style={styles.roomAccessNotice}>
      <Text style={styles.roomAccessNoticeTitle}>{message}</Text>
      <Text style={styles.roomAccessNoticeText}>
        Hãy chờ owner gán phòng trước khi dùng Home, Identity hoặc Alerts.
      </Text>
    </View>
  );
}
