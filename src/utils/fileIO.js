const stripExtension = (name) => name.replace(/\.[^/.]+$/, '');

export const convertForeignObjects = (svg) => {
  const foNodes = svg.querySelectorAll('foreignObject[data-rich-text]');
  foNodes.forEach((fo) => {
    const x = parseFloat(fo.getAttribute('x')) || 0;
    const y = parseFloat(fo.getAttribute('y')) || 0;
    const width = parseFloat(fo.getAttribute('width')) || 0;
    const div = fo.firstElementChild;
    if (!div) return;

    const fontSize = div.style.fontSize || '14px';
    const fontFamily = div.style.fontFamily || 'sans-serif';
    const fontWeight = div.style.fontWeight || 'normal';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;

    // Parse HTML content and convert to structured text with formatting
    const parseHtmlContent = (element) => {
      const result = [];
      
      const processNode = (node, currentStyle = {}) => {
        if (node.nodeType === 3) { // Text node
          if (node.textContent.trim()) {
            result.push({
              text: node.textContent,
              style: { ...currentStyle }
            });
          }
        } else if (node.nodeType === 1) { // Element node
          const newStyle = { ...currentStyle };
          
          // Handle formatting tags
          switch (node.tagName.toLowerCase()) {
            case 'b':
            case 'strong':
              newStyle.fontWeight = 'bold';
              break;
            case 'i':
            case 'em':
              newStyle.fontStyle = 'italic';
              break;
            case 'u':
              newStyle.textDecoration = 'underline';
              break;
            case 'br':
              result.push({ text: '\n', style: currentStyle });
              return;
            case 'div':
              if (result.length > 0) {
                result.push({ text: '\n', style: currentStyle });
              }
              break;
            default:
              break;
          }
          
          // Process child nodes
          for (let child of node.childNodes) {
            processNode(child, newStyle);
          }
          
          // Add line break after div
          if (node.tagName.toLowerCase() === 'div') {
            result.push({ text: '\n', style: currentStyle });
          }
        }
      };
      
      processNode(element);
      return result;
    };

    const parsedContent = parseHtmlContent(div);
    
    // Convert parsed content to lines for wrapping
    const lines = [];
    let currentLine = [];
    
    parsedContent.forEach(item => {
      if (item.text.includes('\n')) {
        const parts = item.text.split('\n');
        parts.forEach((part, index) => {
          if (part) {
            currentLine.push({ text: part, style: item.style });
          }
          if (index < parts.length - 1) {
            lines.push(currentLine);
            currentLine = [];
          }
        });
      } else {
        currentLine.push(item);
      }
    });
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // Wrap lines based on width
    const wrappedLines = [];
    lines.forEach(line => {
      if (!width || line.length === 0) {
        wrappedLines.push(line);
        return;
      }
      
      let currentWrappedLine = [];
      let currentWidth = 0;
      
      line.forEach(item => {
        const words = item.text.split(/\s+/);
        
        words.forEach((word, wordIndex) => {
          const testText = word + (wordIndex < words.length - 1 ? ' ' : '');
          const wordWidth = ctx.measureText(testText).width;
          
          if (currentWidth + wordWidth > width && currentWrappedLine.length > 0) {
            wrappedLines.push(currentWrappedLine);
            currentWrappedLine = [];
            currentWidth = 0;
          }
          
          currentWrappedLine.push({ text: testText, style: item.style });
          currentWidth += wordWidth;
        });
      });
      
      if (currentWrappedLine.length > 0) {
        wrappedLines.push(currentWrappedLine);
      }
    });

    // Create SVG text element
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', x);
    textEl.setAttribute('y', y);
    textEl.setAttribute('font-size', fontSize);
    textEl.setAttribute('font-family', fontFamily);
    textEl.setAttribute('font-weight', fontWeight);

    // Add each line as tspan with appropriate styling
    wrappedLines.forEach((line, lineIndex) => {
      if (line.length === 0) {
        // Empty line - create empty tspan
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', x);
        tspan.setAttribute('dy', lineIndex === 0 ? '1em' : '1.2em');
        tspan.textContent = '';
        textEl.appendChild(tspan);
      } else {
        // Line with content
        line.forEach((item, itemIndex) => {
          const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          
          // Set position - only first item in line gets dy
          if (itemIndex === 0) {
            tspan.setAttribute('x', x);
            tspan.setAttribute('dy', lineIndex === 0 ? '1em' : '1.2em');
          }
          
          // Apply styling
          if (item.style.fontWeight) {
            tspan.setAttribute('font-weight', item.style.fontWeight);
          }
          if (item.style.fontStyle) {
            tspan.setAttribute('font-style', item.style.fontStyle);
          }
          if (item.style.textDecoration) {
            tspan.setAttribute('text-decoration', item.style.textDecoration);
          }
          
          tspan.textContent = item.text;
          textEl.appendChild(tspan);
        });
      }
    });

    fo.replaceWith(textEl);
  });
};

export const getSVGString = (svgElement) => {
  if (!svgElement) return '';
  const originalGroup = svgElement.querySelector('g');
  const bbox = originalGroup ? originalGroup.getBBox() : svgElement.getBBox();
  const clonedSVG = svgElement.cloneNode(true);
  const clonedGroup = clonedSVG.querySelector('g');
  if (clonedGroup) {
    clonedGroup.setAttribute('transform', `translate(${-bbox.x} ${-bbox.y})`);
  }
  convertForeignObjects(clonedSVG);
  clonedSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSVG.setAttribute('width', bbox.width);
  clonedSVG.setAttribute('height', bbox.height);
  clonedSVG.setAttribute('viewBox', `0 0 ${bbox.width} ${bbox.height}`);
  const serializer = new XMLSerializer();
  return serializer.serializeToString(clonedSVG);
};

export const exportSVG = async (svgElement, currentName) => {
  if (!svgElement) return;
  try {
    const originalGroup = svgElement.querySelector('g');
    const bbox = originalGroup ? originalGroup.getBBox() : svgElement.getBBox();

    const defaultName = currentName
      ? `${stripExtension(currentName)}.svg`
      : `genogram-${new Date().toISOString().split('T')[0]}.svg`;

    const clonedSVG = svgElement.cloneNode(true);
    const clonedGroup = clonedSVG.querySelector('g');
    if (clonedGroup) {
      clonedGroup.setAttribute('transform', `translate(${-bbox.x} ${-bbox.y})`);
    }
    convertForeignObjects(clonedSVG);
    clonedSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSVG.setAttribute('width', bbox.width);
    clonedSVG.setAttribute('height', bbox.height);
    clonedSVG.setAttribute('viewBox', `0 0 ${bbox.width} ${bbox.height}`);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSVG);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });

    if (navigator.clipboard && window.ClipboardItem) {
      try {
        await copySvgToClipboardAsImage(blob, bbox);
      } catch (clipboardError) {
        console.error('Could not copy image to clipboard', clipboardError);
        alert('Could not copy image to clipboard: ' + clipboardError.message);
      }
    }

    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: defaultName,
        types: [
          {
            description: 'SVG Image',
            accept: { 'image/svg+xml': ['.svg'] }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultName;
      link.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    if (error.name === 'AbortError' || /aborted a request/i.test(error.message)) {
      alert('Export cancelled.');
    } else {
      alert('Export failed: ' + error.message);
    }
  }
};

const copySvgToClipboardAsImage = async (blob, bbox) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = bbox.width;
        canvas.height = bbox.height;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(async (pngBlob) => {
          try {
            if (pngBlob) {
              const item = new ClipboardItem({ 'image/png': pngBlob });
              await navigator.clipboard.write([item]);
            }
            URL.revokeObjectURL(url);
            resolve();
          } catch (err) {
            URL.revokeObjectURL(url);
            reject(err);
          }
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
};

export const exportData = async (data, currentName) => {
  const defaultName = currentName
    ? (currentName.endsWith('.geno') ? currentName : `${stripExtension(currentName)}.geno`)
    : `genogram-${new Date().toISOString().split('T')[0]}.geno`;
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

  try {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: defaultName,
        types: [
          {
            description: 'Genogram File',
            accept: { 'application/json': ['.geno'] }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(jsonBlob);
      await writable.close();
      return handle.name;
    } else {
      const filename = window.prompt('Enter file name', defaultName);
      if (filename === null) return;
      const url = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.endsWith('.geno') ? filename : `${filename}.geno`;
      link.click();
      URL.revokeObjectURL(url);
      return filename.endsWith('.geno') ? filename : `${filename}.geno`;
    }
  } catch (error) {
    if (error.name === 'AbortError' || /aborted a request/i.test(error.message)) {
      alert('Export cancelled.');
    } else {
      alert('Export failed: ' + error.message);
    }
  }
};
