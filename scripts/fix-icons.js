const fs = require('fs')
const path = require('path')

const DIST = 'dist'
const from = path.join(DIST, 'assets', 'node_modules')
const to = path.join(DIST, 'assets', 'vendor')

const FAVICON = '<link rel="icon" href="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7">'

const HEAD_EXTRA = `<style>
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
    </style>`

const index = path.join(DIST, 'index.html')
if (fs.existsSync(index)) {
  let html = fs.readFileSync(index, 'utf8')
  let changed = false
  if (!html.includes('rel="icon"')) {
    html = html.replace('</title>', '</title>\n    ' + FAVICON)
    changed = true
  }
  if (!html.includes('pedeai-spin')) {
    html = html.replace('</head>', '  ' + HEAD_EXTRA + '\n  </head>')
    changed = true
  }
  if (changed) {
    fs.writeFileSync(index, html)
    console.log('favicon + loading style injetados')
  }
}

if (!fs.existsSync(from)) {
  console.log('fix-icons: nada a mover')
  process.exit(0)
}

fs.rmSync(to, { recursive: true, force: true })
fs.renameSync(from, to)

const walk = (dir) => {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f)
    if (fs.statSync(fp).isDirectory()) walk(fp)
    else if (/\.(js|html|json)$/.test(f)) {
      const c = fs.readFileSync(fp, 'utf8')
      if (c.includes('assets/node_modules')) {
        fs.writeFileSync(fp, c.split('assets/node_modules').join('assets/vendor'))
      }
    }
  }
}
walk(DIST)

console.log('fix-icons: assets/node_modules -> assets/vendor OK')
