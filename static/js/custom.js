class DecryptedText {
  constructor(element, options = {}) {
    this.element = element;
    this.originalText = element.innerText;
    this.textLength = this.originalText.length;
    
    // Options based on the React component props
    this.speed = options.speed || 50;
    this.maxIterations = options.maxIterations || 10;
    this.sequential = options.sequential !== undefined ? options.sequential : false;
    this.revealDirection = options.revealDirection || "start";
    this.useOriginalCharsOnly = options.useOriginalCharsOnly || false;
    this.characters = options.characters || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+";
    
    this.availableChars = this.useOriginalCharsOnly
      ? Array.from(new Set(this.originalText.split(''))).filter(char => char !== ' ')
      : this.characters.split('');

    this.isAnimating = false;
    this.intervalId = null;
    this.revealedIndices = new Set();
    
    this.initDOM();
  }

  initDOM() {
    // Clear the element
    this.element.innerHTML = "";
    this.element.style.position = "relative";
    
    // Create invisible original text to maintain perfect responsive layout (prevents layout shift)
    const layoutSpan = document.createElement("span");
    layoutSpan.innerText = this.originalText;
    layoutSpan.style.visibility = "hidden";
    this.element.appendChild(layoutSpan);
    
    // Create Screen Reader only text for accessibility
    const srSpan = document.createElement("span");
    srSpan.style.cssText = "position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0;";
    srSpan.innerText = this.originalText;
    this.element.appendChild(srSpan);
    
    // Create container for animated text
    this.animatedSpan = document.createElement("span");
    this.animatedSpan.setAttribute("aria-hidden", "true");
    this.animatedSpan.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden;";
    this.element.appendChild(this.animatedSpan);
    
    this.renderText();
  }

  shuffleText() {
    return this.originalText
      .split('')
      .map((char, i) => {
        if (char === ' ') return ' ';
        if (this.revealedIndices.has(i)) return this.originalText[i];
        return this.availableChars[Math.floor(Math.random() * this.availableChars.length)];
      })
      .join('');
  }

  renderText() {
    const textToRender = this.isAnimating ? this.shuffleText() : this.originalText;
    this.animatedSpan.innerText = textToRender;
  }

  computeOrder() {
    const order = [];
    const len = this.textLength;
    if (this.revealDirection === "start") {
      for (let i = 0; i < len; i++) order.push(i);
    } else if (this.revealDirection === "end") {
      for (let i = len - 1; i >= 0; i--) order.push(i);
    } else if (this.revealDirection === "center") {
      const middle = Math.floor(len / 2);
      let offset = 0;
      while (order.length < len) {
        if (offset % 2 === 0) {
          const idx = middle + offset / 2;
          if (idx >= 0 && idx < len) order.push(idx);
        } else {
          const idx = middle - Math.ceil(offset / 2);
          if (idx >= 0 && idx < len) order.push(idx);
        }
        offset++;
      }
    }
    return order.slice(0, len);
  }

  start() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.revealedIndices = new Set();
    
    let currentIteration = 0;
    
    if (this.sequential) {
      const order = this.computeOrder();
      let pointer = 0;
      
      this.intervalId = setInterval(() => {
        if (pointer < order.length) {
          this.revealedIndices.add(order[pointer]);
          pointer++;
          this.renderText();
        } else {
          clearInterval(this.intervalId);
          this.isAnimating = false;
          // Ensure fully revealed
          for (let i = 0; i < this.textLength; i++) this.revealedIndices.add(i);
          this.renderText();
        }
      }, this.speed);
    } else {
      // Non-sequential
      this.intervalId = setInterval(() => {
        this.renderText();
        currentIteration++;
        if (currentIteration >= this.maxIterations) {
          clearInterval(this.intervalId);
          this.isAnimating = false;
          for (let i = 0; i < this.textLength; i++) this.revealedIndices.add(i);
          this.renderText();
        }
      }, this.speed);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".decrypted-text");
  
  elements.forEach((el) => {
    const dt = new DecryptedText(el, {
      speed: 40,                   // Time in ms between each iteration
      sequential: true,            // Reveal one character at a time
      revealDirection: "start",    // From which position characters begin to reveal (start, end, center)
      useOriginalCharsOnly: false  // Restrict scrambling to only the original characters
    });
    
    // Automatically trigger on page load
    dt.start();
  });
});
