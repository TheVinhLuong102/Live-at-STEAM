import React from 'react';

function DropdownWrapper({
  renderer,
} : {
  renderer: Function,
}) {
  const [showDropdown, setShowDropdown] = React.useState(false);
  return renderer(showDropdown, setShowDropdown);
};

export default DropdownWrapper;