import { ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View, ViewStyle } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { colors } from '@/theme'

export function TrashIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M9 3h6M4 7h16M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13M10 11v6M14 11v6"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

export function ShareIcon({ size = 26, color = colors.blue }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10.5} stroke={color} strokeWidth={1.8} fill="none" />
      <Path d="M9.2 14.8L14.8 9.2M10 9.2h4.8V14" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  )
}

export function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#25D366"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
      />
    </Svg>
  )
}

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

export function Toggle({
  value,
  onValueChange,
  activeColor = colors.green,
}: {
  value: boolean
  onValueChange: (v: boolean) => void
  activeColor?: string
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      hitSlop={6}
      style={{
        width: 46,
        height: 27,
        borderRadius: 999,
        backgroundColor: value ? activeColor : '#d6d3d1',
        justifyContent: 'center',
        alignItems: value ? 'flex-end' : 'flex-start',
        paddingHorizontal: 3,
      }}
    >
      <View
        style={{
          width: 21,
          height: 21,
          borderRadius: 999,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
        }}
      />
    </Pressable>
  )
}

export function Badge({ text, bg, fg }: { text: string; bg: string; fg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontWeight: '700', fontSize: 12 }}>{text}</Text>
    </View>
  )
}
