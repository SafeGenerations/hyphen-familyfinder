import { convertForeignObjects } from './fileIO';

// Helper to create an SVG with a foreignObject text box
function createSvg(html) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  fo.setAttribute('data-rich-text', '');
  fo.setAttribute('x', '0');
  fo.setAttribute('y', '0');
  fo.setAttribute('width', '200');
  const div = document.createElement('div');
  div.innerHTML = html;
  fo.appendChild(div);
  svg.appendChild(fo);
  return svg;
}

test('convertForeignObjects preserves line breaks', () => {
  const svg = createSvg('Line1<br>Line2');
  convertForeignObjects(svg);
  const text = svg.querySelector('text');
  expect(text).not.toBeNull();
  const tspans = text.querySelectorAll('tspan');
  expect(tspans.length).toBe(2);
  expect(tspans[0].textContent).toBe('Line1');
  expect(tspans[1].textContent).toBe('Line2');
});
