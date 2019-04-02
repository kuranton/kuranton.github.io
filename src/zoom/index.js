import {getTranslateX} from './util'

export class Zoom {
  constructor(chart) {
    this.chart = chart
    this.min = chart.data.min
    this.max = chart.data.max
    this.svg = document.querySelector('.' + this.chart.containerName + ' .zoom')

    this.draggable = null
    this.mask = null
    this.resizingLeft = false
    this.resizeLeftOffset = 0
    this.resizingRight = false
    this.resizeRightOffset = 0
    this.dragging = false
    this.offset = 0
    this.position = 0
    this.resizePosition = 0
    this.originalWidth = 200
    this.width = 200
  }

  get draggableWidth() {
    return this.width
  }

  get draggablePosition() {
    return this.position
  }

  get scaleX() {
    return this.width/this.originalWidth
  }

  create() {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    el.style.strokeWidth = '12px'
    el.style.vectorEffect = 'non-scaling-stroke'
    el.setAttribute('width', this.draggableWidth)
    const height = this.max - this.min
    const strokeOffset = height/this.svg.getBoundingClientRect().height * 6
    el.setAttribute('height', height + strokeOffset)
    el.setAttribute('y', this.min - strokeOffset/2)
    el.setAttribute('x', 0)
    el.setAttributeNS(null, 'transform', 'matrix(1, 0, 0, 1, 0, 0)')
    this.draggable = el
    this.draggable.style.stroke = 'rgba(0,141,242,0.1)'
    this.mask = el.cloneNode()
    this.mask.style.stroke = 'black'
    this.mask.style.fill = 'black'

    if ('ontouchstart' in window) {
      this.svg.addEventListener('touchstart', this.start.bind(this))
      this.svg.addEventListener('touchmove', this.mousemove.bind(this))
      this.svg.addEventListener('touchend', this.end.bind(this))
      this.svg.addEventListener('touchcancel', this.end.bind(this))
    } else {
      this.svg.addEventListener('mousedown', this.start.bind(this))
      this.svg.addEventListener('mousemove', this.mousemove.bind(this))
      this.svg.addEventListener('mouseup', this.end.bind(this))
    }

    const id = `${this.chart.containerName}-mask`
    const mask = document.querySelector('.' + this.chart.containerName + ' .mask')
    mask.appendChild(this.mask)
    mask.setAttribute('id', id)
    document.querySelector('.' + this.chart.containerName + ' .bg').setAttribute('mask', `url(#${id})`)
    el.style.fill = 'transparent'
    this.svg.appendChild(el)
    this.chart.move(this.position, this.width)
  }

  start(e) {
    this.offset = this.getCoordinates(e) - this.position
    let margin = 5
    if ('ontouchstart' in window) {
      margin = margin*4
    }

    if (this.offset < margin && this.offset > -1 - margin) {
      this.resizingLeft = true
      this.resizeLeftOffset = this.offset
      this.resizePosition = this.position
    } else if (this.offset > (this.width - margin) && this.offset < this.width + 1 + margin) {
      this.resizeRightOffset = this.width - this.offset
      this.resizingRight = true
    } else if (this.offset > 0 && this.offset < this.width) {
      this.dragging = true
    }
  }

  mousemove(e) {
    if (this.resizingLeft) {
      this.resizeLeft(e)
    } else if (this.resizingRight) {
      this.resizeRight(e)
    } else if (this.dragging) {
      this.drag(e)
    }
  }

  resizeLeft(e) {
    const coordinates = this.getCoordinates(e)
    const offset = coordinates - this.position
    let position = this.getCoordinates(e) - this.resizeLeftOffset
    let amount = this.offset - offset
    if (position < 0) {
      if (this.resizePosition > 0) {
        amount = this.resizePosition
      } else {
        amount = 0
      }
      position = 0
    }
    if (position > 0 && this.resizePosition === 0) {
      amount = -position
    }
    if (this.width + amount <= 30) {
      if (this.width > 30) {
        amount = 30 - this.width
        position = this.resizePosition - amount
      } else {
        amount = 0
        position = this.resizePosition
      }
    }
    if (position > this.resizePosition && amount > 0) {
      position = this.resizePosition
      amount = 0
    }
    if (position < this.resizePosition && amount > 0 && this.width === 30) {
      amount = this.resizePosition - position
    }
    this.resizePosition = position
    this.width += amount
    this.offset = offset
    this.draggable.setAttributeNS(null, 'transform', `matrix(${this.scaleX}, 0, 0, 1, ${this.resizePosition}, 0)`)
    this.mask.setAttributeNS(null, 'transform', `matrix(${this.scaleX}, 0, 0, 1, ${this.resizePosition}, 0)`)
    this.chart.move(position, this.width)
  }

  resizeRight(e) {
    let offset = this.getCoordinates(e) - this.position
    if (offset + this.resizeRightOffset < 30) {
      offset = 30 - this.resizeRightOffset
    }
    if (this.position + offset + this.resizeRightOffset > this.chart.data.dates.length*10) {
      offset = this.chart.data.dates.length*10 - this.position - this.resizeRightOffset
    }
    const amount = offset - this.offset
    this.offset = offset
    this.width += amount
    this.draggable.setAttributeNS(null, 'transform', `matrix(${this.scaleX}, 0, 0, 1, ${this.draggablePosition}, 0)`)
    this.mask.setAttributeNS(null, 'transform', `matrix(${this.scaleX}, 0, 0, 1, ${this.draggablePosition}, 0)`)
    this.chart.move(this.position, this.width)
  }

  drag(e) {
    if (this.dragging) {
      const position = (this.getCoordinates(e) - this.offset)
      this.move(position)
    }
  }

  end(e) {
    if (this.resizingLeft) {
      this.position = this.resizePosition
    }
    this.resizingLeft = false
    this.resizingRight = false
    this.dragging = false
  }

  move(position) {
    position = Math.max(0, position)
    position = Math.min(this.chart.data.dates.length*10 - this.width, position)
    this.position = position
    this.draggable.setAttributeNS(null, 'transform', `matrix(${this.scaleX}, 0, 0, 1, ${position}, 0)`)
    this.mask.setAttributeNS(null, 'transform', `matrix(${this.scaleX}, 0, 0, 1, ${position}, 0)`)
    this.chart.move(this.position, this.width)
  }

  getCoordinates(e) {
    let {clientX} = e
    if (e.touches && e.touches.length) {
      clientX = e.touches[0].clientX
    }
    const ctm = this.svg.getScreenCTM()
    return (clientX - ctm.e) / ctm.a
  }
}
