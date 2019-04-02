export function getTranslateX(target) {
  return parseFloat(target.getAttributeNS(null, 'transform').slice(10,-1).split(' ')[0])
}
