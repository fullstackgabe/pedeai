import { ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View, ViewStyle } from 'react-native'
import { colors } from '@/theme'

export function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  style?: ViewStyle
}) {
  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.redSoft : 'transparent'
  const fg =
    variant === 'primary' ? '#fff' : variant === 'danger' ? colors.red : colors.primary
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 18,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: colors.primary,
          opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ color: fg, fontWeight: '700', fontSize: 16 }}>{title}</Text>
      )}
    </Pressable>
  )
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  multiline,
  autoCapitalize,
  labelRight,
}: {
  label: string
  value: string
  onChangeText: (t: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'decimal-pad'
  secureTextEntry?: boolean
  multiline?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words'
  labelRight?: ReactNode
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>{label}</Text>
        {labelRight}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSoft}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
          color: colors.text,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? 'top' : undefined,
        }}
      />
    </View>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 7, marginTop: 2 }}>
      {children}
    </Text>
  )
}

export function Badge({ text, bg, fg }: { text: string; bg: string; fg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontWeight: '700', fontSize: 12 }}>{text}</Text>
    </View>
  )
}
