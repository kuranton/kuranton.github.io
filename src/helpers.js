export const debounce = (f, delay) => {
  let wrapper
  return function() {
    clearTimeout(wrapper)
    wrapper = setTimeout(() => f.apply(this, arguments), delay)
  }
}

export const throttle = (f, delay) => {
  let start = performance.now()
  let wrapper
  return function() {
    const t = performance.now()

    clearTimeout(wrapper)
    if (t >= start + delay) {
      start = t
      f.apply(this, arguments)
    } else {
      wrapper = setTimeout(() => f.apply(this, arguments), start + delay - t)
    }
  }
}

export function animate(from, to, f, duration, target) {
  const amt = to - from
  const start = performance.now()
  const draw = () => {
    const time = performance.now()
    const passed = Math.min(duration, time - start)
    f(from, passed/duration, amt, target)
    if (passed < duration) {
      requestAnimationFrame(draw)
    }
  }
  requestAnimationFrame(draw)
}

export function scaleText(x, y) {
  const elements = document.querySelectorAll('.tick text')
  for (let i=0; i< elements.length; i++) {
    elements[i].style.transform = `scale(${x}, ${y})`
  }
}

export function formatDate(timestamp) {
  const date = new Date(timestamp)
  const month = date.toLocaleString('en-us', {month: 'short'})
  return `${month} ${date.getDate()}`
}
