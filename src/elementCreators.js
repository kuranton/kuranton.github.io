export function createPlots(data) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.classList.add('plots')
  for (let name in data.points) {
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
    polyline.classList.add(name)
    polyline.setAttribute('points', data.points[name].join(' '))
    polyline.style.stroke = data.colors[name]
    polyline.setAttribute('stroke-linejoin', 'round')
    g.appendChild(polyline)
  }
  return g
}

export function createTooltipLine(height) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  line.classList.add('tooltip-line')
  line.setAttribute('y1', 0)
  line.setAttribute('y2', height)
  return line
}

export function createMarker(name, color) {
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  circle.style.stroke = color
  circle.classList.add(name, 'marker')
  circle.setAttributeNS(null, 'r', '5px')
  return circle
}

export function createTooltip(data) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.classList.add('tooltip')

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  let valueWidth = `${data.max}`.length*20
  if (window.devicePixelRatio && window.devicePixelRatio >= 2) {
    valueWidth = valueWidth * 2
  }
  const width = 2*valueWidth
  const height = Math.floor(data.columns.length/2)*80 + 60
  rect.setAttributeNS(null, 'd', `M11,3 h${width} a10,10 0 0 1 10,10 v${height} a10,10 0 0 1 -10,10 h-${width} a10,10 0 0 1 -10,-10 v-${height} a10,10 0 0 1 10,-10 z`)
  rect.classList.add('container')

  const date = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  date.setAttribute('x', 15)
  date.setAttribute('y', 30)
  date.classList.add('date')

  g.appendChild(rect)
  g.appendChild(date)

  data.columns.map((col, i) => {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    label.setAttribute('x', 15 + valueWidth*(i%2))
    label.style.fill = data.colors[col[0]]

    const yOffset = (Math.floor(i/2) + 1) * 80

    const value = label.cloneNode()
    label.classList.add('label')
    label.setAttribute('y', yOffset + 45)
    label.textContent = col[0]

    value.setAttribute('y', yOffset + 15)
    value.classList.add('value', `value-${col[0]}`)

    g.appendChild(label)
    g.appendChild(value)
  })
  return g
}

export function createTick(width, lineHeight, ratio, i) {
  const offset = lineHeight * ratio
  const tick = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  tick.classList.add('tick', `tick${i}`)
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  line.setAttribute('x1', 10)
  line.setAttribute('x2', width - 10)
  line.setAttribute('y1', offset*(6-i))
  line.setAttribute('y2', offset*(6-i))
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text.classList.add('tick-text', `tick-text${i}`)
  text.setAttribute('x', 10)
  let yOffset = offset*(6-i) - 80
  if (window.innerWidth < 1100) {
    yOffset -= 10
  }
  text.setAttribute('y', yOffset)
  text.textContent = lineHeight*i
  tick.appendChild(line)
  return {tick, text}
}

export function createButton(text, color) {
  const button = document.createElement('button')
  button.classList.add('toggle')
  button.setAttribute('type', 'button')
  button.setAttribute('value', text)
  const icon = document.createElement('span')
  icon.classList.add('icon')
  icon.style.background = color
  button.appendChild(icon)
  const txt = document.createElement('span')
  txt.textContent = text
  button.appendChild(txt)
  return button
}
