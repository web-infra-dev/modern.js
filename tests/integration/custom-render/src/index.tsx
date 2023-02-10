export default (_: React.ComponentType, originRender: any) => {
  const div = document.createElement('div');
  div.id = 'csr';
  div.innerHTML = 'Custom Render';
  document.body.appendChild(div);
  originRender();
};
