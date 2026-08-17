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
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><path d=%22M24 7c-3 4 3 6 0 10%22 stroke=%22%23fb923c%22 stroke-width=%225%22 stroke-linecap=%22round%22 fill=%22none%22/><path d=%22M40 7c-3 4 3 6 0 10%22 stroke=%22%23fb923c%22 stroke-width=%225%22 stroke-linecap=%22round%22 fill=%22none%22/><rect x=%228%22 y=%2222%22 width=%2248%22 height=%2210%22 rx=%225%22 fill=%22%23ea580c%22/><path d=%22M12 36h40v8c0 7-5 12-12 12H24c-7 0-12-5-12-12v-8z%22 fill=%22%23f97316%22/><rect x=%2226%22 y=%2244%22 width=%2212%22 height=%224%22 rx=%222%22 fill=%22%23ffedd5%22/></svg>"
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  )
}
