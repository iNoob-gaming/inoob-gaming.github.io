class LavaCave {
  constructor() {
    this.gridWidth = 5;
    this.gridHeight = 8;
    this.totalTiles = this.gridWidth * this.gridHeight;

    this.preloadImages().then(() => {
      this.initializeGrid();
    });
  }

  async preloadImages() {
    const uniqueItems = Array.from(new Set(data));
    const imagePromises = uniqueItems.map(item => this.loadImage(`assets/${item}.png`));

    imagePromises.push(this.loadImage('assets/empty.png'));
    imagePromises.push(this.loadImage('assets/blocked.png'));

    await Promise.all(imagePromises);
    console.log("All images preloaded");
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = resolve;
      img.onerror = reject;
    });
  }

  createTile(content, index) {
    const tile = document.createElement("div");
    tile.classList.add("tile", "non-clickable");

    // Add the "start" class if this tile is the start tile
    if (content === "start") {
      tile.classList.add("start");
    }

    const img = document.createElement("img");
    img.src = content === "start" ? `assets/start.png` : `assets/empty.png`;
    img.alt = content || "empty";
    tile.appendChild(img);

    const adjacentIndices = this.getAdjacentIndices(index);
    tile.dataset.adjacentIndices = JSON.stringify(adjacentIndices);
    tile.dataset.index = index;

    return tile;
  }

  createHitBar(hitPoints) {
    const hitBarContainer = document.createElement("div");
    hitBarContainer.classList.add("hit-bar-container");

    const hitBar = document.createElement("div");
    hitBar.classList.add("hit-bar");
    hitBar.textContent = `${hitPoints}/${hitPoints}`;
    hitBar.dataset.maxHitPoints = hitPoints;
    hitBar.dataset.currentHitPoints = hitPoints;

    hitBarContainer.appendChild(hitBar);
    return hitBarContainer;
  }

  enableClicksOnAdjacentTiles(tile) {
    const adjacentIndices = JSON.parse(tile.dataset.adjacentIndices);

    adjacentIndices.forEach(index => {
      const adjacentTile = document.querySelector(`.tile[data-index='${index}']`);

      if (adjacentTile && !adjacentTile.classList.contains("blocked") && adjacentTile.classList.contains("non-clickable")) {
        adjacentTile.classList.remove("non-clickable");
        adjacentTile.classList.add("clickable");

        adjacentTile.addEventListener("click", () => this.revealTile(adjacentTile), { once: true });
      }
    });
  }

  removeTileContent(tile) {
    const img = tile.querySelector("img");
    if (img) {
      img.remove();
    }

    const hitBarContainer = tile.querySelector(".hit-bar-container");
    if (hitBarContainer) {
      hitBarContainer.remove()
    }

    tile.classList.remove("clickable")
    tile.classList.add("non-clickable")
  }

  removeAdjacentBlocks(tile) {
    const adjacentIndices = JSON.parse(tile.dataset.adjacentIndices);

    adjacentIndices.forEach(index => {
      const adjacentTile = document.querySelector(`.tile[data-index='${index}']`);

      if (!adjacentTile) {
        return;
      }

      if (adjacentTile.classList.contains("blocked")) {
        adjacentTile.classList.remove("blocked");
      }
    });

    this.enableClicksOnAdjacentTiles(tile)
    
  }

  attackTile(tile){
    const hitBar = tile.querySelector(".hit-bar")
    let currentHitPoints = parseInt(hitBar.dataset.currentHitPoints, 10);
    currentHitPoints -= 1;

    console.log({currentHitPoints});
    hitBar.dataset.currentHitPoints = currentHitPoints;
    hitBar.textContent = `${currentHitPoints}/${hitBar.dataset.maxHitPoints}`;

    if (currentHitPoints <= 0) {
      this.removeAdjacentBlocks(tile);
      this.removeTileContent(tile);
    }
  }

  revealTile(tile) {
    const index = tile.dataset.index;
    const content = data[index];

    tile.classList.add("revealed");
    tile.classList.add(content);

    // Update the tile image based on its content
    const img = tile.querySelector("img");
    if (content && content !== "empty") {
      img.src = `assets/${content}.png`;
      img.alt = content;

      // If the tile has hit points (e.g., mob, elite, haka, or boulder), add a hit bar
      if (content in hitPointsConfig) {
        const hitBar = this.createHitBar(hitPointsConfig[content]);
        tile.appendChild(hitBar);
        tile.addEventListener("click", () => this.attackTile(tile), { once: false });}
    } else {
      this.removeTileContent(tile)
    }

    // Block adjacent tiles if content meets blocking criteria
    if (content && content !== 'start' && content !== 'door' && content !== 'empty') {
      this.blockAdjacentTiles(tile);
    } else {
      // Enable clicks on adjacent tiles if not blocking
      this.enableClicksOnAdjacentTiles(tile);
    }
  }

  blockAdjacentTiles(tile) {
    const adjacentIndices = JSON.parse(tile.dataset.adjacentIndices);

    adjacentIndices.forEach(index => {
      const adjacentTile = document.querySelector(`.tile[data-index='${index}']`);

      if (adjacentTile && !adjacentTile.classList.contains("revealed")) {
        adjacentTile.classList.add("blocked");
      }
    });
  }

  getAdjacentIndices(index) {
    const top = index - this.gridWidth;
    const left = (index % this.gridWidth !== 0) ? index - 1 : -1;
    const right = ((index + 1) % this.gridWidth !== 0) ? index + 1 : -1;
    const bottom = index + this.gridWidth;

    return [top, left, right, bottom].filter(i => i >= 0 && i < this.totalTiles);
  }

  initializeGrid() {
    const tileContainer = document.getElementById('tile-container');
    tileContainer.innerHTML = '';

    data.forEach((item, index) => {
      const tile = this.createTile(item, index);
      tileContainer.appendChild(tile);
    });

    // Identify and enable adjacent clicks for the start tile
    const startTile = document.querySelector(".tile.start");
    if (startTile) {
      this.enableClicksOnAdjacentTiles(startTile);
    }
  }
}

// Define hit points for different types
const hitPointsConfig = {
  mob: 2,
  elite: 5,
  haka: 100,
  boulder: 15
};

// Updated data array with "boulder" instead of "stone"
const data = [
  'door', 'mob', 'mob', 'hammer', 'mob',
  'empty', 'empty', 'empty', 'mob', 'elite',
  'boulder', 'mob', 'mob', 'mob', 'empty',
  'empty', 'mob', 'mob', 'mob', 'empty',
  'elite', 'empty', 'elite', 'boulder', 'boulder',
  'boulder', 'empty', 'empty', 'haka', 'mob',
  'empty', 'empty', 'boulder', 'empty', 'empty',
  'start', 'empty', 'empty', 'empty', 'mob'
];

const cave = new LavaCave();

