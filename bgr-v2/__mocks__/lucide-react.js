const React = require('react')

const createIcon = (iconName) => {
  const Icon = ({ children, ...props }) => React.createElement('svg', { ...props, 'data-icon': iconName }, children)
  Icon.displayName = `MockLucideIcon(${String(iconName)})`
  return Icon
}

module.exports = new Proxy({}, {
  get: (_, iconName) => createIcon(iconName),
})
