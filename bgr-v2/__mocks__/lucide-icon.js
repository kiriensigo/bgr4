const React = require('react')

module.exports = ({ children, ...props }) => React.createElement('svg', { ...props, 'data-icon': 'lucide-mock' }, children)
