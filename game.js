class Minesweeper {
    constructor() {
        this.rows = 10;
        this.cols = 10;
        this.minesCount = 10;
        this.board = [];
        this.mines = [];
        this.revealedCount = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.flagsCount = 0;
        this.timer = 0;
        this.timerInterval = null;
        
        // Система очков и способностей (хранятся в переменных)
        this.score = 0;
        this.bestScore = 0;
        this.abilities = {
            scanner: {
                name: "Сканер",
                icon: "🔍",
                cost: 50,
                uses: 1,
                maxUses: 1,
                description: "Показывает 3 ближайшие мины"
            },
            shield: {
                name: "Щит",
                icon: "🛡️",
                cost: 100,
                uses: 1,
                maxUses: 1,
                description: "Защита от взрыва"
            },
            hint: {
                name: "Подсказка",
                icon: "💡",
                cost: 30,
                uses: 3,
                maxUses: 3,
                description: "Показывает безопасную клетку"
            }
        };
        
        this.boardElement = document.getElementById('board');
        this.resetButton = document.getElementById('resetButton');
        this.minesCounterElement = document.querySelector('.mines-counter');
        this.timerElement = document.querySelector('.timer');
        this.scoreElement = document.getElementById('scoreValue');
        this.bestScoreElement = document.getElementById('bestScoreValue');
        this.abilitiesPanel = document.getElementById('abilitiesPanel');
        
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.initializeGame();
        this.updateScoreDisplay();
    }
    
    initializeGame() {
        this.board = [];
        this.mines = [];
        this.revealedCount = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.flagsCount = 0;
        this.timer = 0;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.updateMinesCounter();
        this.timerElement.textContent = '000';
        this.resetButton.textContent = '😊';
        
        // Сброс способностей
        this.abilities.scanner.uses = this.abilities.scanner.maxUses;
        this.abilities.shield.uses = this.abilities.shield.maxUses;
        this.abilities.hint.uses = this.abilities.hint.maxUses;
        
        this.boardElement.innerHTML = '';
        this.abilitiesPanel.innerHTML = '';
        
        // Создаем ячейки
        for (let i = 0; i < this.rows; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // Используем touch события для лучшей совместимости с мобильными устройствами
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e));
                
                // Добавляем обработку долгого нажатия для мобильных устройств
                let pressTimer;
                cell.addEventListener('touchstart', (e) => {
                    pressTimer = setTimeout(() => {
                        e.preventDefault();
                        this.handleRightClick(e);
                    }, 500); // 500ms для долгого нажатия
                });
                
                cell.addEventListener('touchend', () => {
                    clearTimeout(pressTimer);
                });
                
                cell.addEventListener('touchmove', () => {
                    clearTimeout(pressTimer);
                });
                
                this.boardElement.appendChild(cell);
                this.board[i][j] = {
                    element: cell,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
        
        // Создаем панель способностей
        this.createAbilitiesPanel();
    }
    
    createAbilitiesPanel() {
        for (const [key, ability] of Object.entries(this.abilities)) {
            const abilityElement = document.createElement('div');
            abilityElement.className = 'ability';
            abilityElement.id = `ability-${key}`;
            abilityElement.innerHTML = `
                <div class="ability-icon">${ability.icon}</div>
                <div class="ability-name">${ability.name}</div>
                <div class="ability-cost">${ability.cost} очков</div>
                <div class="ability-uses">Использований: ${ability.uses}/${ability.maxUses}</div>
            `;
            
            abilityElement.addEventListener('click', () => this.useAbility(key));
            this.abilitiesPanel.appendChild(abilityElement);
        }
        
        this.updateAbilitiesPanel();
    }
    
    updateAbilitiesPanel() {
        for (const [key, ability] of Object.entries(this.abilities)) {
            const abilityElement = document.getElementById(`ability-${key}`);
            const usesElement = abilityElement.querySelector('.ability-uses');
            usesElement.textContent = `Использований: ${ability.uses}/${ability.maxUses}`;
            
            // Обновляем состояние способности
            abilityElement.classList.remove('disabled');
            if (ability.uses <= 0 || this.score < ability.cost || this.gameOver || this.gameWon) {
                abilityElement.classList.add('disabled');
            }
        }
    }
    
    useAbility(abilityKey) {
        const ability = this.abilities[abilityKey];
        
        if (ability.uses <= 0 || this.score < ability.cost || this.gameOver || this.gameWon) {
            this.showMessage("Недостаточно очков или использований!");
            return;
        }
        
        switch(abilityKey) {
            case 'scanner':
                this.useScanner();
                break;
            case 'shield':
                // Щит активируется автоматически при попадании на мину
                this.showMessage("Щит активирован! Следующая мина не взорвёт вас.");
                break;
            case 'hint':
                this.useHint();
                break;
        }
        
        if (abilityKey !== 'shield') {
            ability.uses--;
            this.score -= ability.cost;
            this.updateScoreDisplay();
            this.updateAbilitiesPanel();
        }
    }
    
    useScanner() {
        // Находим все мины и показываем 3 ближайшие
        const mines = this.mines;
        if (mines.length === 0) return;
        
        // Показываем 3 ближайшие мины
        const shownMines = mines.slice(0, Math.min(3, mines.length));
        
        shownMines.forEach(mine => {
            const cell = this.board[mine.row][mine.col].element;
            cell.classList.add('scanner-highlight');
        });
        
        // Убираем подсветку через 3 секунды
        setTimeout(() => {
            shownMines.forEach(mine => {
                const cell = this.board[mine.row][mine.col].element;
                cell.classList.remove('scanner-highlight');
            });
        }, 3000);
        
        this.showMessage("Сканер показывает ближайшие мины!");
    }
    
    useHint() {
        // Находим все безопасные клетки рядом с открытыми
        const safeCells = [];
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = this.board[i][j];
                if (!cell.isRevealed && !cell.isMine && !cell.isFlagged) {
                    // Проверяем, есть ли рядом открытые клетки
                    let hasRevealedNeighbor = false;
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            const ni = i + di;
                            const nj = j + dj;
                            if (this.isValidCell(ni, nj) && this.board[ni][nj].isRevealed) {
                                hasRevealedNeighbor = true;
                                break;
                            }
                        }
                        if (hasRevealedNeighbor) break;
                    }
                    
                    if (hasRevealedNeighbor) {
                        safeCells.push({row: i, col: j});
                    }
                }
            }
        }
        
        if (safeCells.length > 0) {
            // Выбираем случайную безопасную клетку
            const randomIndex = Math.floor(Math.random() * safeCells.length);
            const hintCell = safeCells[randomIndex];
            const cellElement = this.board[hintCell.row][hintCell.col].element;
            
            cellElement.classList.add('highlighted');
            
            // Убираем подсветку через 2 секунды
            setTimeout(() => {
                cellElement.classList.remove('highlighted');
            }, 2000);
            
            this.showMessage("Подсказка показывает безопасную клетку!");
        } else {
            this.showMessage("Нет доступных подсказок!");
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.timerElement.textContent = this.timer.toString().padStart(3, '0');
        }, 1000);
    }
    
    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < this.minesCount) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Не ставим мину на первую клетку и если там уже есть мина
            if ((row === excludeRow && col === excludeCol) || this.board[row][col].isMine) {
                continue;
            }
            
            this.board[row][col].isMine = true;
            this.mines.push({row, col});
            minesPlaced++;
            
            // Обновляем счетчики соседей
            this.updateNeighbors(row, col);
        }
    }
    
    updateNeighbors(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                
                if (this.isValidCell(newRow, newCol) && !this.board[newRow][newCol].isMine) {
                    this.board[newRow][newCol].neighborMines++;
                }
            }
        }
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    handleCellClick(event) {
        // Предотвращаем контекстное меню на мобильных устройствах
        event.preventDefault();
        
        if (this.gameOver || this.gameWon) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) return;
        
        // При первом клике размещаем мины
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }
        
        if (cell.isMine) {
            // Проверяем, активен ли щит
            if (this.abilities.shield.uses > 0) {
                this.abilities.shield.uses--;
                cell.element.classList.add('shield-protected');
                this.showMessage("Щит спас вас от взрыва!");
                this.updateAbilitiesPanel();
                return;
            }
            
            this.revealMines();
            this.endGame(false);
            return;
        }
        
        this.revealCell(row, col);
        
        // Проверяем победу
        if (this.revealedCount === (this.rows * this.cols - this.minesCount)) {
            this.endGame(true);
        }
    }
    
    handleRightClick(event) {
        // Предотвращаем стандартное контекстное меню
        event.preventDefault();
        event.stopPropagation();
        
        if (this.gameOver || this.gameWon) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        const cell = this.board[row][col];
        
        if (cell.isRevealed) return;
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            cell.element.classList.remove('flagged');
            this.flagsCount--;
        } else {
            cell.isFlagged = true;
            cell.element.classList.add('flagged');
            this.flagsCount++;
        }
        
        this.updateMinesCounter();
    }
    
    revealCell(row, col) {
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) return;
        
        cell.isRevealed = true;
        cell.element.classList.add('revealed');
        this.revealedCount++;
        
        if (cell.neighborMines > 0) {
            cell.element.textContent = cell.neighborMines;
            cell.element.classList.add(`number-${cell.neighborMines}`);
        } else {
            // Рекурсивно открываем соседние пустые клетки
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    
                    if (this.isValidCell(newRow, newCol)) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }
    }
    
    revealMines() {
        for (const mine of this.mines) {
            const cell = this.board[mine.row][mine.col];
            if (!cell.isFlagged) {
                cell.isRevealed = true;
                cell.element.classList.add('revealed', 'mine');
            }
        }
    }
    
    endGame(isWin) {
        this.gameOver = true;
        this.gameWon = isWin;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.resetButton.textContent = isWin ? '😎' : '😵';
        
        // Начисляем очки за победу
        if (isWin) {
            const points = Math.max(10, 200 - this.timer);
            this.score += points;
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
            }
            this.showMessage(`Победа! +${points} очков!`);
        }
        
        this.updateScoreDisplay();
        this.updateAbilitiesPanel();
        
        // Показываем сообщение о завершении игры
        setTimeout(() => {
            const gameOverDiv = document.createElement('div');
            gameOverDiv.className = 'game-over';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'game-over-content';
            
            const title = document.createElement('h2');
            title.textContent = isWin ? 'Поздравляем! Вы выиграли!' : 'Игра окончена!';
            
            const timeText = document.createElement('p');
            timeText.textContent = `Ваше время: ${this.timer} секунд`;
            timeText.style.fontSize = '16px';
            timeText.style.margin = '10px 0';
            
            const scoreText = document.createElement('p');
            scoreText.innerHTML = `Очки: <strong>${this.score}</strong><br>Рекорд: <strong>${this.bestScore}</strong>`;
            scoreText.style.fontSize = '16px';
            scoreText.style.margin = '10px 0';
            
            const resetButton = document.createElement('button');
            resetButton.textContent = 'Новая игра';
            resetButton.addEventListener('click', () => {
                document.body.removeChild(gameOverDiv);
                this.resetGame();
            });
            
            contentDiv.appendChild(title);
            contentDiv.appendChild(timeText);
            contentDiv.appendChild(scoreText);
            contentDiv.appendChild(resetButton);
            gameOverDiv.appendChild(contentDiv);
            document.body.appendChild(gameOverDiv);
        }, 500);
    }
    
    updateMinesCounter() {
        const remainingMines = this.minesCount - this.flagsCount;
        this.minesCounterElement.textContent = remainingMines.toString().padStart(3, '0');
    }
    
    updateScoreDisplay() {
        this.scoreElement.textContent = this.score;
        this.bestScoreElement.textContent = this.bestScore;
    }
    
    showMessage(text) {
        // Удаляем предыдущие сообщения
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Создаем новое сообщение
        const message = document.createElement('div');
        message.className = 'message';
        message.textContent = text;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 2000);
    }
    
    resetGame() {
        this.initializeGame();
    }
}

// Запуск игры
window.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
