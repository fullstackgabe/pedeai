import { Text, View } from 'react-native'
import Svg, { Path, Rect } from 'react-native-svg'
import { colors } from '@/theme'

export function LogoIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M24 7c-3 4 3 6 0 10" stroke="#fb923c" strokeWidth={5} strokeLinecap="round" fill="none" />
      <Path d="M40 7c-3 4 3 6 0 10" stroke="#fb923c" strokeWidth={5} strokeLinecap="round" fill="none" />
      <Rect x={8} y={22} width={48} height={10} rx={5} fill="#ea580c" />
      <Path d="M12 36h40v8c0 7-5 12-12 12H24c-7 0-12-5-12-12v-8z" fill="#f97316" />
      <Rect x={26} y={44} width={12} height={4} rx={2} fill="#ffedd5" />
    </Svg>
  )
}

export function LogoWordmark({ size = 17, light = false }: { size?: number; light?: boolean }) {
  return (
    <Text style={{ fontSize: size, fontWeight: '900' }}>
      <Text style={{ color: light ? '#fff' : colors.text }}>Pede</Text>
      <Text style={{ color: colors.primary }}>Aí</Text>
    </Text>
  )
}

export function Logo({ iconSize = 24, textSize = 17, light = false }: { iconSize?: number; textSize?: number; light?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <LogoIcon size={iconSize} />
      <LogoWordmark size={textSize} light={light} />
    </View>
  )
}
