import { router, Stack } from 'expo-router'
import { Platform, SafeAreaView } from 'react-native'
import { AuthProvider } from '@/lib/auth'
import { CartProvider } from '@/lib/cart'
import StackHeader from '@/components/StackHeader'

if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('web-frame')) {
  const s = document.createElement('style')
  s.id = 'web-frame'
  s.textContent = `
    html,body{margin:0}
    input:focus, textarea:focus, select:focus { outline: 2px solid #ea580c !important; outline-offset: 0 !important; }
    @media (min-width:720px){
      body{background:linear-gradient(135deg,#fed7aa,#fecaca);min-height:100vh}
      #root{width:460px;max-width:100%;height:min(860px, calc(100vh - 48px));margin:24px auto;background:#fff;border-radius:36px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,.22)}
    }`
  document.head.appendChild(s)
}

const VOLTAR_PARA: Record<string, string> = {
  dados: '/',
  montar: '/dados',
  checkout: '/montar',
  login: '/',
}

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff7ed' }}>
      <AuthProvider>
        <CartProvider>
          <Stack
            screenOptions={{
              header: ({ options, navigation, back, route }) => (
                <StackHeader
                  title={typeof options.title === 'string' ? options.title : ''}
                  canGoBack={route.name !== 'pedido/[id]' && (!!back || route.name in VOLTAR_PARA)}
                  onBack={() => {
                    if (back) {
                      navigation.goBack()
                    } else {
                      router.replace((VOLTAR_PARA[route.name] || '/') as any)
                    }
                  }}
                />
              ),
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="dados" options={{ title: 'Seus dados' }} />
            <Stack.Screen name="montar" options={{ title: 'Monte sua marmita' }} />
            <Stack.Screen name="checkout" options={{ title: 'Finalizar pedido' }} />
            <Stack.Screen name="pedido/[id]" options={{ title: 'Acompanhar pedido' }} />
            <Stack.Screen name="login" options={{ title: 'Área do restaurante' }} />
            <Stack.Screen name="admin/index" options={{ headerShown: false }} />
          </Stack>
        </CartProvider>
      </AuthProvider>
    </SafeAreaView>
  )
}
