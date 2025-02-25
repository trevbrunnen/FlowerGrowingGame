class Flower {
  constructor(red, green, blue, parent1 = null, parent2 = null) {
    this.red = Math.min(255, Math.max(0, Math.floor(red)));
    this.green = Math.min(255, Math.max(0, Math.floor(green)));
    this.blue = Math.min(255, Math.max(0, Math.floor(blue)));
    this.parent1 = parent1;
    this.parent2 = parent2;
    this.id = `flower_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.growthStage = 0; // 0-100
  }

  get isGold() {
    return this.red === 255 && this.green === 255 && this.blue === 255;
  }

  get color() {
    if (this.isGold) {
      return 'gold';
    }
    return `rgb(${this.red}, ${this.green}, ${this.blue})`;
  }

  get value() {
    const avgStat = (this.red + this.green + this.blue) / 3;
    return Math.floor(Math.pow(avgStat, 1.5));
  }

  get stats() {
    return `R:${this.red} G:${this.green} B:${this.blue}`;
  }
}

class Game {
  constructor() {
    this.score = 0;
    this.money = 100;
    this.inventory = [];
    this.seeds = [
      { id: 'red_seed', name: 'Red Seed', red: 125, green: 0, blue: 0, cost: 10 },
      { id: 'green_seed', name: 'Green Seed', red: 0, green: 125, blue: 0, cost: 10 },
      { id: 'blue_seed', name: 'Blue Seed', red: 0, green: 0, blue: 125, cost: 10 }
    ];
    
    this.plots = {
      plot1: { flower: null, growing: false, progressBar: null },
      plot2: { flower: null, growing: false, progressBar: null },
      breeding: { flower: null, breeding: false, progressBar: null }
    };
    
    this.selectedPlot = null;
    this.harvestingPlot = null;
    
    this.initializeGame();
  }
  
  initializeGame() {
    // Initialize DOM references
    this.scoreElement = document.getElementById('score');
    this.moneyElement = document.getElementById('money');
    
    this.plotElements = {
      plot1: document.getElementById('plot1'),
      plot2: document.getElementById('plot2'),
      breeding: document.getElementById('breeding-plot')
    };
    
    this.progressBars = {
      plot1: document.getElementById('progress-plot1'),
      plot2: document.getElementById('progress-plot2'),
      breeding: document.getElementById('progress-breeding')
    };
    
    // Initialize menus
    this.seedMenu = document.getElementById('seed-menu');
    this.harvestMenu = document.getElementById('harvest-menu');
    this.shopMenu = document.getElementById('shop-menu');
    this.inventoryMenu = document.getElementById('inventory-menu');
    this.notification = document.getElementById('notification');
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Initial UI update
    this.updateUI();
  }
  
  attachEventListeners() {
    // Plot click events
    this.plotElements.plot1.addEventListener('click', () => this.handlePlotClick('plot1'));
    this.plotElements.plot2.addEventListener('click', () => this.handlePlotClick('plot2'));
    this.plotElements.breeding.addEventListener('click', () => this.handlePlotClick('breeding'));
    
    // Menu buttons
    document.getElementById('shop-button').addEventListener('click', () => this.openShop());
    document.getElementById('inventory-button').addEventListener('click', () => this.openInventory());
    
    // Close buttons for modals
    const closeButtons = document.querySelectorAll('.close-button');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => this.closeAllMenus());
    });
    
    // Harvest buttons
    document.getElementById('harvest-yes').addEventListener('click', () => this.harvestFlower(true));
    document.getElementById('harvest-no').addEventListener('click', () => this.harvestFlower(false));
    
    // Notification close
    document.getElementById('notification-close').addEventListener('click', () => {
      this.notification.style.display = 'none';
    });
  }
  
  handlePlotClick(plotId) {
    const plot = this.plots[plotId];
    
    // If breeding plot and not both parent plots have flowers, do nothing
    if (plotId === 'breeding' && (!this.plots.plot1.flower || !this.plots.plot2.flower || 
                                 this.plots.plot1.flower.growthStage < 100 || 
                                 this.plots.plot2.flower.growthStage < 100)) {
      return;
    }
    
    // If plot has a fully grown flower, show harvest menu
    if (plot.flower && plot.flower.growthStage >= 100) {
      this.harvestingPlot = plotId;
      this.harvestMenu.style.display = 'block';
      return;
    }
    
    // If breeding plot and both parent plots have flowers, start breeding
    if (plotId === 'breeding' && !plot.breeding && !plot.flower) {
      this.startBreeding();
      return;
    }
    
    // If plot is empty and not breeding plot, show seed menu
    if (!plot.flower && !plot.growing && plotId !== 'breeding') {
      this.selectedPlot = plotId;
      this.openSeedMenu();
    }
  }
  
  openSeedMenu() {
    const seedList = document.getElementById('seed-list');
    seedList.innerHTML = '';
    
    this.seeds.forEach(seed => {
      if (this.money >= seed.cost) {
        const seedItem = document.createElement('div');
        seedItem.className = 'seed-item';
        seedItem.innerHTML = `
          <div class="seed-color" style="background-color: rgb(${seed.red}, ${seed.green}, ${seed.blue});"></div>
          <div class="seed-info">
            <div>${seed.name}</div>
            <div>R:${seed.red} G:${seed.green} B:${seed.blue}</div>
          </div>
          <div class="seed-cost">$${seed.cost}</div>
        `;
        seedItem.addEventListener('click', () => this.plantSeed(seed));
        seedList.appendChild(seedItem);
      }
    });
    
    // Also show flowers from inventory that can be planted
    this.inventory.forEach(flower => {
      const flowerItem = document.createElement('div');
      flowerItem.className = 'seed-item';
      flowerItem.innerHTML = `
        <div class="seed-color" style="background-color: ${flower.color};"></div>
        <div class="seed-info">
          <div>Flower</div>
          <div>${flower.stats}</div>
        </div>
        <div class="seed-cost">Owned</div>
      `;
      flowerItem.addEventListener('click', () => this.plantFlowerFromInventory(flower));
      seedList.appendChild(flowerItem);
    });
    
    this.seedMenu.style.display = 'block';
  }
  
  plantSeed(seed) {
    if (this.money >= seed.cost) {
      this.money -= seed.cost;
      const flower = new Flower(seed.red, seed.green, seed.blue);
      this.plots[this.selectedPlot].flower = flower;
      this.plots[this.selectedPlot].growing = true;
      this.startGrowing(this.selectedPlot);
      this.closeAllMenus();
      this.updateUI();
    }
  }
  
  plantFlowerFromInventory(flower) {
    // Remove from inventory
    const index = this.inventory.findIndex(f => f.id === flower.id);
    if (index !== -1) {
      this.inventory.splice(index, 1);
      
      // Reset growth stage
      flower.growthStage = 0;
      
      // Plant in selected plot
      this.plots[this.selectedPlot].flower = flower;
      this.plots[this.selectedPlot].growing = true;
      this.startGrowing(this.selectedPlot);
      this.closeAllMenus();
      this.updateUI();
    }
  }
  
  startGrowing(plotId) {
    const progressBar = this.progressBars[plotId];
    progressBar.style.display = 'block';
    progressBar.style.width = '0%';
    
    const growthInterval = setInterval(() => {
      const plot = this.plots[plotId];
      if (plot.flower) {
        plot.flower.growthStage += 1;
        progressBar.style.width = `${plot.flower.growthStage}%`;
        
        if (plot.flower.growthStage >= 100) {
          clearInterval(growthInterval);
          plot.growing = false;
          
          // Check for gold flower
          if (plot.flower.isGold) {
            this.showNotification("Congratulations, you've found the rare, gold flower!");
          }
          
          // Increment score
          this.score++;
          this.updateUI();
          
          // Check if both plots have flowers for breeding
          this.checkBreedingConditions();
        }
      } else {
        clearInterval(growthInterval);
        progressBar.style.display = 'none';
        plot.growing = false;
      }
    }, 100); // Growth speed - adjust as needed
  }
  
  harvestFlower(confirmed) {
    const plot = this.plots[this.harvestingPlot];
    
    if (confirmed && plot.flower) {
      // Add to inventory
      this.inventory.push(plot.flower);
      
      // Clear plot
      plot.flower = null;
      this.progressBars[this.harvestingPlot].style.display = 'none';
    }
    
    this.harvestMenu.style.display = 'none';
    this.harvestingPlot = null;
    this.updateUI();
    
    // Check breeding conditions
    this.checkBreedingConditions();
  }
  
  checkBreedingConditions() {
    // If both plots have fully grown flowers and breeding plot is empty, show breeding button
    if (this.plots.plot1.flower && this.plots.plot2.flower && 
        this.plots.plot1.flower.growthStage >= 100 && 
        this.plots.plot2.flower.growthStage >= 100 && 
        !this.plots.breeding.flower && !this.plots.breeding.breeding) {
      this.plotElements.breeding.style.cursor = 'pointer';
    } else {
      this.plotElements.breeding.style.cursor = 'default';
    }
  }
  
  startBreeding() {
    if (!this.plots.plot1.flower || !this.plots.plot2.flower) return;
    
    this.plots.breeding.breeding = true;
    const progressBar = this.progressBars.breeding;
    progressBar.style.display = 'block';
    progressBar.style.width = '0%';
    
    let progress = 0;
    const breedingInterval = setInterval(() => {
      progress += 1;
      progressBar.style.width = `${progress}%`;
      
      if (progress >= 100) {
        clearInterval(breedingInterval);
        this.plots.breeding.breeding = false;
        
        // Create new flower with combined traits
        const parent1 = this.plots.plot1.flower;
        const parent2 = this.plots.plot2.flower;
        
        // Base stats are average of parents with a random modifier
        const randomMod = () => Math.floor(Math.random() * 41) - 20; // -20 to +20
        
        const newRed = Math.min(255, Math.max(0, Math.floor((parent1.red + parent2.red) / 2) + randomMod()));
        const newGreen = Math.min(255, Math.max(0, Math.floor((parent1.green + parent2.green) / 2) + randomMod()));
        const newBlue = Math.min(255, Math.max(0, Math.floor((parent1.blue + parent2.blue) / 2) + randomMod()));
        
        const breedFlower = new Flower(newRed, newGreen, newBlue, parent1, parent2);
        breedFlower.growthStage = 100; // Immediately grown
        
        this.plots.breeding.flower = breedFlower;
        
        // Check for gold flower
        if (breedFlower.isGold) {
          this.showNotification("Congratulations, you've found the rare, gold flower!");
        }
        
        // Increment score
        this.score++;
        this.updateUI();
      }
    }, 100); // Breeding speed - adjust as needed
  }
  
  openShop() {
    const shopList = document.getElementById('shop-list');
    shopList.innerHTML = '';
    
    this.seeds.forEach(seed => {
      const shopItem = document.createElement('div');
      shopItem.className = 'shop-item';
      shopItem.innerHTML = `
        <div class="seed-color" style="background-color: rgb(${seed.red}, ${seed.green}, ${seed.blue});"></div>
        <div class="seed-info">
          <div>${seed.name}</div>
          <div>R:${seed.red} G:${seed.green} B:${seed.blue}</div>
        </div>
        <div class="seed-cost">$${seed.cost}</div>
      `;
      
      if (this.money >= seed.cost) {
        shopItem.addEventListener('click', () => this.buySeed(seed));
      } else {
        shopItem.classList.add('disabled');
      }
      
      shopList.appendChild(shopItem);
    });
    
    this.shopMenu.style.display = 'block';
  }
  
  buySeed(seed) {
    if (this.money >= seed.cost) {
      this.money -= seed.cost;
      const newFlower = new Flower(seed.red, seed.green, seed.blue);
      newFlower.growthStage = 0;
      this.inventory.push(newFlower);
      this.updateUI();
      this.openShop(); // Refresh shop
    }
  }
  
  openInventory() {
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = '';
    
    if (this.inventory.length === 0) {
      inventoryList.innerHTML = '<div class="empty-inventory">Your inventory is empty</div>';
    } else {
      this.inventory.forEach(flower => {
        const inventoryItem = document.createElement('div');
        inventoryItem.className = 'inventory-item';
        inventoryItem.innerHTML = `
          <div class="flower-color" style="background-color: ${flower.color};"></div>
          <div class="flower-info">
            <div>Flower</div>
            <div>${flower.stats}</div>
          </div>
          <div class="flower-value">$${flower.value}</div>
          <button class="sell-button">Sell</button>
        `;
        
        const sellButton = inventoryItem.querySelector('.sell-button');
        sellButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.sellFlower(flower);
        });
        
        inventoryList.appendChild(inventoryItem);
      });
    }
    
    this.inventoryMenu.style.display = 'block';
  }
  
  sellFlower(flower) {
    const index = this.inventory.findIndex(f => f.id === flower.id);
    if (index !== -1) {
      this.inventory.splice(index, 1);
      this.money += flower.value;
      this.updateUI();
      this.openInventory(); // Refresh inventory
    }
  }
  
  showNotification(message) {
    document.getElementById('notification-text').textContent = message;
    this.notification.style.display = 'block';
  }
  
  closeAllMenus() {
    this.seedMenu.style.display = 'none';
    this.harvestMenu.style.display = 'none';
    this.shopMenu.style.display = 'none';
    this.inventoryMenu.style.display = 'none';
  }
  
  updateUI() {
    // Update score and money
    this.scoreElement.textContent = `Score: ${this.score}`;
    this.moneyElement.textContent = `Money: $${this.money}`;
    
    // Update plots
    Object.keys(this.plots).forEach(plotId => {
      const plot = this.plots[plotId];
      const plotElement = this.plotElements[plotId];
      
      // Clear existing flower
      const existingFlower = plotElement.querySelector('.flower');
      if (existingFlower) {
        plotElement.removeChild(existingFlower);
      }
      
      // Add flower if exists
      if (plot.flower && plot.flower.growthStage > 0) {
        const flowerElement = document.createElement('div');
        flowerElement.className = 'flower';
        if (plot.flower.isGold) {
          flowerElement.classList.add('gold-flower');
        } else {
          flowerElement.style.backgroundColor = plot.flower.color;
        }
        
        // Scale size based on growth stage
        const size = Math.max(20, plot.flower.growthStage * 0.8);
        flowerElement.style.width = `${size}%`;
        flowerElement.style.height = `${size}%`;
        
        plotElement.appendChild(flowerElement);
      }
    });
  }
}

// Initialize the game when page loads
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
});