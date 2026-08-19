import { ScrollViewStyleReset } from 'expo-router/html'
import { type PropsWithChildren } from 'react'

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>PedeAí</title>
        <ScrollViewStyleReset />
        <style>{`
          html,body{margin:0;background:linear-gradient(135deg,#fed7aa,#fecaca);min-height:100vh}
          #root:empty{min-height:100vh}
          #root:empty::after{
            content:'';
            position:fixed;
            top:50%;left:50%;
            width:44px;height:44px;
            margin:-22px 0 0 -22px;
            border:4px solid #ffedd5;
            border-top-color:#ea580c;
            border-radius:50%;
            animation:pedeai-spin .8s linear infinite;
          }
          @keyframes pedeai-spin{to{transform:rotate(360deg)}}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
