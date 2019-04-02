import * as chart_data from './chart_data.json'
import {Zoom} from './zoom'
import {XScale} from './xScale'
import {throttle, debounce, animate, scaleText, formatDate} from './helpers'
import {createPlots, createTooltip, createTooltipLine, createMarker, createTick, createButton} from './elementCreators'

class Chart {
  constructor(containerName, data) {
    this.containerName = containerName
    this.container = document.querySelector('.'+containerName)
    this.data = this.prepareData(data)
    this.svg = document.querySelector(`.${this.containerName} .main`)
    this.xScale = new XScale(this)
    this.zoom = new Zoom(this)

    this.start = this.start.bind(this)
    this.mousemove = this.mousemove.bind(this)
    this.end = this.end.bind(this)
    this.toggle = this.toggle.bind(this)
    this.setHeight = debounce(this.setHeight, 100)

    this.position = 0
    this.width = 200
    this.yRatio = 1
    this.lineHeight = this.data.max/5.5
    this.hidden = []
  }

  get max() {
    return this.lineHeight*5.5
  }

  get matrix() {
    return [this.xRatio, 0, 0, 1, -this.position*this.xRatio, 0]
  }

  get rect() {
    return this.svg.getBoundingClientRect()
  }

  get xRatio() {
    return this.rect.width/this.width
  }

  prepareData(data) {
    let {columns, colors} = data
    let points = {}
    const xIndex = columns.findIndex(el => el[0] === 'x')
    const x = columns.splice(xIndex, 1)[0]
    let min = null
    let max = null
    let dates = []
    for (let i = 1; i < x.length; i++) {
      dates.push(formatDate(x[i]))
      columns.map(col => {
        if (!points[col[0]]) {
          points[col[0]] = []
        }
        min = Math.min(min, col[i])
        max = Math.max(max, col[i])
        points[col[0]].push(`${(i-1)*10},${col[i]}`)
      })
    }
    return {columns, colors, points, min, max, dates, x}
  }

  move(position, width) {
    this.position = position
    this.width = width

    const plots = document.querySelector(`.${this.containerName} .plots`)
    plots.style.transform = `matrix(${this.matrix.join(', ')})`

    this.xScale.move()
    this.setHeight()
  }

  setHeight() {
    const left = Math.ceil(this.position/10 + 1)
    const right = Math.ceil((this.position + this.width)/10 + 1)
    this.getYExtents(left, right)
    const yRatio = this.rect.height/this.max
    if (this.yRatio === yRatio) {
      return
    }
    const stretch = this.yRatio < yRatio
    this.yRatio = yRatio
    const polylines = document.querySelectorAll(`.${this.containerName} .main .plots polyline`)
    for (let i=0; i<polylines.length; i++) {
      const plot = polylines[i]
      plot.style.transform = `scale(1, ${this.yRatio})`
    }
    this.updateTicks(stretch)
  }

  updateTicks(stretch) {
    const container = document.querySelector(`.${this.containerName} .ticks`)
    const textContainer = document.querySelector(`.${this.containerName} .tick-texts`)
    for (let i=5; i>=1; i--) {
      const old = document.querySelector(`.${this.containerName} .tick${i}`)
      const oldText = document.querySelector(`.${this.containerName} .tick-text${i}`)
      let {top} = old.getBoundingClientRect()
      const stretched = i * (this.rect.height - top)/this.yRatio
      const shrinked = (i-6) * (this.rect.height - top)/this.yRatio

      const {tick, text} = createTick(this.rect.width, this.lineHeight, this.yRatio, i)
      tick.classList.add('enter')
      text.classList.add('enter')

      if (stretch) {
        old.classList.add('old')
        oldText.classList.add('old')
        old.setAttributeNS(null, 'transform', `translate(0,${stretched})`)
        oldText.setAttributeNS(null, 'transform', `translate(0,${stretched}) scale(1,-1)`)
        tick.setAttributeNS(null, 'transform', `translate(0,${shrinked})`)
        text.setAttributeNS(null, 'transform', `translate(0,${shrinked}) scale(1,-1)`)
      } else {
        old.classList.add('old')
        oldText.classList.add('old')
        old.setAttributeNS(null, 'transform', `translate(0,${shrinked})`)
        oldText.setAttributeNS(null, 'transform', `translate(0,${shrinked}) scale(1,-1)`)
        tick.setAttributeNS(null, 'transform', `translate(0,${stretched})`)
        text.setAttributeNS(null, 'transform', `translate(0,${stretched}) scale(1,-1)`)
      }

      container.appendChild(tick)
      textContainer.appendChild(text)
      setTimeout(() => {
        tick.setAttributeNS(null, 'transform', `translate(0,0)`)
        text.setAttributeNS(null, 'transform', `translate(0,0) scale(1,-1)`)
      },0)

      setTimeout(() => {
        tick.classList.remove('enter')
        text.classList.remove('enter')
      },333)
    }
    setTimeout(() => {
      const array = document.querySelectorAll(`.${this.containerName} .old`)
      for (let i=0; i<array.length; i++) {
        array[i].remove()
      }
    })
  }

  getYExtents(start, end) {
    let minCol = []
    let maxCol = []
    this.data.columns.map((col, i) => {
      if (this.hidden.indexOf(col[0]) === -1) {
        const array = col.slice(start, end)
        minCol.push(Math.min.apply(null, array))
        maxCol.push(Math.max.apply(null, array))
      }
    })
    const min = Math.min.apply(null, minCol)
    let max = Math.max.apply(null, maxCol)
    let modulo = max%5
    let lineHeight = (max-modulo)/5
    if (modulo < Math.floor(lineHeight/2) && (lineHeight-1)*5.5 > max) {
      lineHeight--
    }
    while (modulo > lineHeight/2) {
      lineHeight++
    }
    this.lineHeight = lineHeight
  }

  start(e) {
    const line = createTooltipLine(this.rect.height)
    const tooltip = createTooltip(this.data)
    this.svg.appendChild(line)
    this.svg.appendChild(tooltip)
    this.data.columns.map(col => {
      const marker = createMarker(col[0], this.data.colors[col[0]])
      this.svg.appendChild(marker)
    })
    this.mousemove(e)
  }

  mousemove(e) {
    const coordinate = e.touches ? this.getCoordinates(e.touches[0]) : this.getCoordinates(e)
    let point = Math.round((coordinate/this.xRatio+this.position)/10)
    point = Math.max(0, point)
    point = Math.min(point, this.data.dates.length-1)
    let offset = this.position%(this.xRatio*10)
    let cx = Math.round(coordinate/(this.xRatio*10))*10*this.xRatio
    const line = document.querySelector(`.${this.containerName} .tooltip-line`)
    line.setAttribute('x1', (point*10-this.position)*this.xRatio)
    line.setAttribute('x2', (point*10-this.position)*this.xRatio)

    const tooltip = document.querySelector(`.${this.containerName} .tooltip`)
    let x = Math.max(0,(point*10-this.position)*this.xRatio - 20)
    x = Math.min(x, this.rect.width - 122)
    tooltip.setAttribute('transform', `translate(${x}, 0) scale(1,-1)`)
    const dateText = document.querySelector(`.${this.containerName} .tooltip .date`)
    dateText.textContent = new Date(this.data.x[point+1]).toLocaleDateString('en-us', {weekday: 'short', day: 'numeric', month: 'short'})

    this.data.columns.map(col => {
      const circle = document.querySelector(`.${this.containerName} .marker.${col[0]}`)
      const label = document.querySelector(`.${this.containerName} .value-${col[0]}`)
      label.textContent = col[point+1]
      if (!circle) {
        return
      }
      const cx = this.data.points[col[0]][point].split(',')[0]
      const cy = this.data.points[col[0]][point].split(',')[1]
      circle.setAttributeNS(null, 'cx', cx*this.xRatio - this.position*this.xRatio)
      circle.setAttributeNS(null, 'cy', cy*this.yRatio)
      this.svg.insertBefore(circle, document.querySelector(`.${this.containerName} .tooltip`))
    })
  }

  end() {
    const line = document.querySelector(`.${this.containerName} .tooltip-line`)
    const tooltip = document.querySelector(`.${this.containerName} .tooltip`)
    line.remove()
    tooltip.remove()
    this.data.columns.map(col => {
      const circle = document.querySelector(`.${this.containerName} circle.${col[0]}`)
      if (!circle) {
        return
      }
      circle.remove()
    })
  }

  toggle(e) {
    const {value} = e.target
    if (this.hidden.find(el => el === value)) {
      this.hidden.splice(this.hidden.indexOf(value), 1)
      document.querySelector(`.${this.containerName} polyline.${value}`).style.opacity = 1
      e.target.classList.remove('active')
    } else {
      this.hidden.push(value)
      document.querySelector(`.${this.containerName} polyline.${value}`).style.opacity = 0
      e.target.classList.add('active')
    }
    if (this.hidden.length < this.data.columns.length) {
      this.setHeight()
    }
  }

  init() {
    this.setDimensions()
    this.xScale.init()
    this.svg.addEventListener('touchstart', this.start)
    this.svg.addEventListener('touchmove', this.mousemove)
    this.svg.addEventListener('touchend', this.end)
    this.svg.addEventListener('touchcancel', this.end)
    this.svg.addEventListener('mouseenter', this.start)
    this.svg.addEventListener('mousemove', this.mousemove)
    this.svg.addEventListener('mouseleave', this.end)
    this.zoom.svg.setAttribute('viewBox', `0 ${this.data.min} ${(this.data.dates.length - 1) * 10} ${this.data.max - this.data.min}`)
    const plots = createPlots(this.data)
    const zoomPlots = plots.cloneNode(true)
    this.zoom.svg.insertBefore(zoomPlots, document.querySelector(`.${this.containerName} .bg`))
    this.svg.insertBefore(plots, document.querySelector(`.${this.containerName} .tick-texts`))
    this.zoom.create()
    this.data.columns.map(col => {
      const button = createButton(col[0], this.data.colors[col[0]])
      if ('ontouchstart' in window) {
        button.addEventListener('touchstart', this.toggle)
      } else {
        button.addEventListener('click', this.toggle)
      }
      document.querySelector(`.${this.containerName} .buttons`).appendChild(button)
    })
  }

  setDimensions() {
    let {height, width} = this.container.getBoundingClientRect()
    const style = getComputedStyle(this.container)
    height -= parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.marginTop) + parseFloat(style.marginBottom)
    width -= parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.marginLeft) + parseFloat(style.marginRight)
    height = Math.min(height - 200, width)
    this.svg.setAttribute('width', width)
    this.svg.setAttribute('height', height)
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    this.zoom.svg.setAttribute('width', width)
    this.zoom.svg.setAttribute('height', 120)
    this.zoom.svg.setAttribute('viewBox', `0 0 ${width} 120`)
  }

  getCoordinates(e) {
    const ctm = this.svg.getScreenCTM()
    return (e.clientX - ctm.e) / ctm.a
  }
}

for (let i=0; i<5; i++) {
  const chart = new Chart(`wrapper${i+1}`, chart_data[i])
  chart.init()
}
