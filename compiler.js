const input = document.getElementById("input")
const output = document.getElementById("output")
const themeSelect = document.getElementById("themeSelect")

let state = {}
let components = {}

input.value = `
state count = 0
state step = 2

component Card(text) {
  Column {
    Text(text) size 18
  }
  padding 12
  border
}

Column {
  Text("Count: {count}") size 24
  Button("Add") click increment step {step}
  Card("Reusable component!")
} when screen > 400
`

themeSelect.addEventListener("change", () => {
  document.body.className = themeSelect.value
})

input.addEventListener("input", compile)
window.addEventListener("resize", compile)
compile()

function compile() {
  let code = input.value
  state = {}
  components = {}

  // Parse theme
  if(!document.body.className) document.body.className = themeSelect.value

  // Parse state (support multiple)
  code = code.replace(/state (\w+) = ([\d]+)/g, (_, k, v) => {
    state[k] = Number(v)
    return ""
  })

  // Parse components
  code = code.replace(/component (\w+)\((.*?)\)\s*{([\s\S]*?)}/g, (_, name, args, body) => {
    components[name] = { args: args.split(","), body }
    return ""
  })

  // Handle responsive rules
  const screenWidth = window.innerWidth
  code = code.replace(/([\s\S]*?)\s*when screen *([><]=?) *(\d+)/g, (_, block, op, val) => {
    val = Number(val)
    if(op === ">" && screenWidth > val) return block
    if(op === ">=" && screenWidth >= val) return block
    if(op === "<" && screenWidth < val) return block
    if(op === "<=" && screenWidth <= val) return block
    return ""
  })

  output.innerHTML = render(code)
}

// Render components recursively
function render(code) {
  Object.keys(components).forEach(name => {
    const comp = components[name]
    const regex = new RegExp(`${name}\\("([^"]+)"\\)`, "g")
    code = code.replace(regex, (_, value) => {
      return render(comp.body.replace(comp.args[0], `"${value}"`))
    })
  })

  // Text
  code = code.replace(/Text\("([^"]+)"\)(.*?)\n/g, (_, text, styles) => styled(`<p>${interpolate(text)}</p>`, styles))

  // Button with click and optional step
  code = code.replace(/Button\("([^"]+)"\)(.*?)\n/g, (_, label, styles) => {
    const stepMatch = styles.match(/step {(\w+)}/)
    const stepVal = stepMatch ? state[stepMatch[1]] || 1 : 1
    return styled(`<button onclick="increment(${stepVal})">${label}</button>`, styles)
  })

  // Column
  code = code.replace(/Column\s*{([\s\S]*?)}/g, `<div class="column">$1</div>`)

  return code
}

// Styling
function styled(html, styles) {
  let style = ""

  if(styles.includes("size")) {
    const s = styles.match(/size (\d+)/)[1]
    style += `font-size:${s}px;`
  }
  if(styles.includes("padding")) {
    const p = styles.match(/padding (\d+)/)[1]
    style += `padding:${p}px;`
  }
  if(styles.includes("border")) style += `border:1px solid #ccc;`

  return html.replace(">", ` style="${style}">`)
}

// Interpolate state variables
function interpolate(text) {
  return text.replace(/{(\w+)}/g, (_, k) => state[k])
}

// Increment state function with step
function increment(step = 1) {
  state.count += step
  compile()
}

