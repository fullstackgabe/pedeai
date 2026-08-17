import { Pressable, Text, View } from 'react-native'
import { colors } from '@/theme'

export default function StackHeader({
  title,
  canGoBack,
  onBack,
}: {
  title: string
  canGoBack: boolean
  onBack: () => void
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 14,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {canGoBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={{ paddingRight: 10 }}>
          <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '700' }}>‹</Text>
        </Pressable>
      ) : null}
      <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>{title}</Text>
    </View>
  )
}
