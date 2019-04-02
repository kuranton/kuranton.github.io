export class XScale {
  constructor(chart) {
    this.chart = chart
    this.el = null
  }

  create() {
    const container = document.createElement('div')
    container.classList.add('xscale-container')
    const scale = document.createElement('div')
    scale.classList.add('xscale')
    this.el = scale
    container.appendChild(scale)
    return container
  }

  move() {
    let style = document.querySelector(`#${this.chart.containerName}-xscale`)
    if (!style) {
      style = document.createElement('style')
      style.setAttribute('id', `${this.chart.containerName}-xscale`)
      document.head.appendChild(style)
    }
    const margin = 80
    const width = this.chart.data.dates.length*10/this.chart.width * this.chart.rect.width
    const left = -this.chart.position*(this.chart.rect.width/this.chart.width)
    let n = Math.ceil(this.chart.data.dates.length/(width/margin))
    if (window.innerWidth < 1100) {
      n = n*2
    }
    style.textContent = `
      .${this.chart.containerName} .xscale {
        width: ${width}px;
        left: ${left}px;
      }
      .${this.chart.containerName} .xscale span:not(:nth-of-type(${n}n + 1)) {
        opacity: 0;
      }
    `
  }

  init() {
    this.chart.container.insertBefore(this.create(), this.chart.zoom.svg.parentNode)
    const offset = 100/this.chart.data.dates.length
    this.chart.data.dates.map((date, i) => {
      const text = document.createElement('span')
      text.textContent = date
      text.style.left = i*offset + '%'
      this.el.appendChild(text)
    })
  }
}
