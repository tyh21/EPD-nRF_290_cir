let painting = false;
let lastX = 0;
let lastY = 0;
let brushColor = "#000000";
let brushSize = 2;
let currentTool = null; // Start with no tool selected
let textElements = []; // Store text elements for re-rendering after dithering
let lineSegments = []; // Store line segments for re-rendering after dithering
let isTextPlacementMode = false;
let draggingCanvasContext = null; // Backup of the canvas for dragging
let selectedTextElement = null; // Track the currently selected text for dragging
let isDraggingText = false; // Track if we're currently dragging text
let dragOffsetX = 0; // Offset from mouse to text position when dragging
let dragOffsetY = 0;
let textBold = false; // Track if text should be bold
let textItalic = false; // Track if text should be italic

function setCanvasTitle(title) {
  const canvasTitle = document.querySelector('.canvas-title');
  if (canvasTitle) {
    canvasTitle.innerText = title;
    canvasTitle.style.display = title && title !== '' ? 'block' : 'none';
  }
}

function initPaintTools() {
  document.getElementById('brush-mode').addEventListener('click', () => {
    if (currentTool === 'brush') {
      setActiveTool(null, '');
    } else {
      setActiveTool('brush', '画笔模式');
      brushColor = document.getElementById('brush-color').value;
    }
  });
  
  document.getElementById('eraser-mode').addEventListener('click', () => {
    if (currentTool === 'eraser') {
      setActiveTool(null, '');
    } else {
      setActiveTool('eraser', '橡皮擦');
      brushColor = "#FFFFFF";
    }
  });

  document.getElementById('text-mode').addEventListener('click', () => {
    if (currentTool === 'text') {
      setActiveTool(null, '');
    } else {
      setActiveTool('text', '插入文字');
      brushColor = document.getElementById('brush-color').value;
    }
  });
  
  document.getElementById('brush-color').addEventListener('change', (e) => {
    brushColor = e.target.value;
  });
  
  document.getElementById('brush-size').addEventListener('change', (e) => {
    brushSize = parseInt(e.target.value);
  });

  document.getElementById('add-text-btn').addEventListener('click', startTextPlacement);

  // Add event listeners for bold and italic buttons
  document.getElementById('text-bold').addEventListener('click', () => {
    textBold = !textBold;
    document.getElementById('text-bold').classList.toggle('primary', textBold);
  });
  
  document.getElementById('text-italic').addEventListener('click', () => {
    textItalic = !textItalic;
    document.getElementById('text-italic').classList.toggle('primary', textItalic);
  });
  
  setupCanvasForPainting();

  // Override the existing clear_canvas function to clear our text positions too
  const originalClearCanvas = window.clear_canvas;
  window.clear_canvas = function() {
    if(originalClearCanvas()) {
      textElements = []; // Clear stored text positions
      lineSegments = []; // Clear stored line segments
      return true;
    }
    return false;
  };

  // Override the existing convert_dithering function to preserve text and lines
  const originalConvertDithering = window.convert_dithering;
  window.convert_dithering = function() {
    originalConvertDithering();
    // Redraw text and lines after dithering
    redrawTextElements();
    redrawLineSegments();
  };
  
  // Ensure no tool is selected by default
  updateToolUI();
}

function setActiveTool(tool, title) {
  currentTool = tool;
  updateToolUI();

  setCanvasTitle(title);

  // Cancel any pending text placement
  cancelTextPlacement();
}

function updateToolUI() {
  // Update UI to reflect active tool or no tool
  document.getElementById('brush-mode').classList.toggle('active', currentTool === 'brush');
  document.getElementById('eraser-mode').classList.toggle('active', currentTool === 'eraser');
  document.getElementById('text-mode').classList.toggle('active', currentTool === 'text');
  
  // Show/hide text tools
  document.querySelectorAll('.text-tools').forEach(el => {
    el.style.display = currentTool === 'text' ? 'flex' : 'none';
  });
}

function setupCanvasForPainting() {
  canvas.addEventListener('mousedown', startPaint);
  canvas.addEventListener('mousemove', paint);
  canvas.addEventListener('mouseup', endPaint);
  canvas.addEventListener('mouseleave', endPaint);
  canvas.addEventListener('click', handleCanvasClick);
  
  // Touch support
  canvas.addEventListener('touchstart', handleTouchStart);
  canvas.addEventListener('touchmove', handleTouchMove);
  canvas.addEventListener('touchend', endPaint);
}

function startPaint(e) {
  if (!currentTool) return;

  if (currentTool === 'text') {
    // Check if we're clicking on a text element to drag
    const textElement = findTextElementAt(e);
    if (textElement && textElement === selectedTextElement) {
      isDraggingText = true;
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      
      // Calculate offset for smooth dragging
      dragOffsetX = textElement.x - x;
      dragOffsetY = textElement.y - y;
      
      return; // Don't start drawing
    }
  } else {
    painting = true;
    draw(e);
  }
}

function endPaint() {
  painting = false;
  isDraggingText = false;
  lastX = 0;
  lastY = 0;
}

function paint(e) {
  if (!currentTool) return;

  if (currentTool === 'text') {
    if (isDraggingText && selectedTextElement) {
      dragText(e);
    }
  } else {
    if (painting) {
      draw(e);
    }
  }
}

function draw(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = brushColor;
  ctx.lineWidth = brushSize;
  
  ctx.beginPath();
  
  if (lastX === 0 && lastY === 0) {
    // For the first point, just do a dot
    ctx.moveTo(x, y);
    ctx.lineTo(x+0.1, y+0.1);
    
    // Store the dot for redrawing
    lineSegments.push({
      type: 'dot',
      x: x,
      y: y,
      color: brushColor,
      size: brushSize
    });
  } else {
    // Connect to the previous point
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    
    // Store the line segment for redrawing
    lineSegments.push({
      type: 'line',
      x1: lastX,
      y1: lastY,
      x2: x,
      y2: y,
      color: brushColor,
      size: brushSize
    });
  }
  
  ctx.stroke();
  
  lastX = x;
  lastY = y;
}

function handleCanvasClick(e) {
  if (currentTool === 'text' && isTextPlacementMode) {
    placeText(e);
  }
}

// Improve touch handling for text placement
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    
    // If in text placement mode, handle as a click
    if (currentTool === 'text' && isTextPlacementMode) {
        const mouseEvent = new MouseEvent('click', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
        return;
    }
    
    // Otherwise handle as normal drawing
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function dragText(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  
  // Update text position with offset
  selectedTextElement.x = x + dragOffsetX;
  selectedTextElement.y = y + dragOffsetY;
  
  // Redraw selected text element
  if (draggingCanvasContext) {
    ctx.putImageData(draggingCanvasContext, 0, 0);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  ctx.font = selectedTextElement.font;
  ctx.fillStyle = selectedTextElement.color;
  ctx.fillText(selectedTextElement.text, selectedTextElement.x, selectedTextElement.y);
}

function findTextElementAt(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  
  // Search through text elements in reverse order (top-most first)
  for (let i = textElements.length - 1; i >= 0; i--) {
    const text = textElements[i];
    
    // Calculate text dimensions
    ctx.font = text.font;
    const textWidth = ctx.measureText(text.text).width;

    // Extract font size correctly from the font string
    // This handles "bold 14px Arial", "italic 14px Arial", "bold italic 14px Arial", etc.
    const fontSizeMatch = text.font.match(/(\d+)px/);
    const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]) : 14; // Default to 14 if not found
    const textHeight = fontSize * 1.2; // Approximate height
    
    // Check if click is within text bounds (allowing for some margin)
    const margin = 5;
    if (x >= text.x - margin && 
        x <= text.x + textWidth + margin && 
        y >= text.y - textHeight + margin && 
        y <= text.y + margin) {
      return text;
    }
  }
  
  return null;
}

function startTextPlacement() {
  const text = document.getElementById('text-input').value.trim();
  if (!text) {
      alert('请输入文字内容');
      return;
  }

  isTextPlacementMode = true;

  // Add visual feedback
  setCanvasTitle('点击画布放置文字');
  canvas.classList.add('text-placement-mode');
}

function cancelTextPlacement() {
  isTextPlacementMode = false;
  canvas.classList.remove('text-placement-mode'); 

  // reset dragging state
  isDraggingText = false;
  dragOffsetX = 0;
  dragOffsetY = 0;
  selectedTextElement = null;
  draggingCanvasContext = null;
}

function placeText(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  const text = document.getElementById('text-input').value;
  const fontFamily = document.getElementById('font-family').value;
  const fontSize = document.getElementById('font-size').value;

  // Build font style string
  let fontStyle = '';
  if (textItalic) fontStyle += 'italic ';
  if (textBold) fontStyle += 'bold ';
  
  // Create a new text element
  const newText = {
    text: text,
    x: x,
    y: y,
    font: `${fontStyle}${fontSize}px ${fontFamily}`,
    color: brushColor
  };
  
  // Add to our list of text elements
  textElements.push(newText);
  
  // Select this text element for immediate dragging
  selectedTextElement = newText;
  draggingCanvasContext = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Draw text on canvas
  ctx.font = newText.font;
  ctx.fillStyle = newText.color;
  ctx.fillText(newText.text, newText.x, newText.y);
  
  // Reset
  document.getElementById('text-input').value = '';
  isTextPlacementMode = false;
  canvas.classList.remove('text-placement-mode');
  setCanvasTitle('拖动新添加文字可调整位置');
}

function redrawTextElements() {
  // Redraw all text elements after dithering
  textElements.forEach(item => {
    ctx.font = item.font;
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x, item.y);
  });
}

function redrawLineSegments() {
  // Redraw all line segments after dithering
  lineSegments.forEach(segment => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = segment.color;
    ctx.lineWidth = segment.size;
    ctx.beginPath();
    
    if (segment.type === 'dot') {
      ctx.moveTo(segment.x, segment.y);
      ctx.lineTo(segment.x+0.1, segment.y+0.1);
    } else {
      ctx.moveTo(segment.x1, segment.y1);
      ctx.lineTo(segment.x2, segment.y2);
    }
    
    ctx.stroke();
  });
}

// Initialize paint functionality when the page loads
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initPaintTools, 500); // Delay to ensure canvas is initialized
});