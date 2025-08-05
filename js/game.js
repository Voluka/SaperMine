// Основной класс игры с системой уровней
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
        
        // Инициализация системы данных
        this.gameData = new GameData();
        this.levelSystem = new LevelSystem(this.gameData);
        this.userData = this.gameData.getUserData();
        
        // Получаем разблокированные способности
        this.unlockedAbilities = this.levelSystem.getUnlockedAbilities();
        
        this.boardElement = document.getElementById('board');
        this.resetButton = document.getElementById('resetButton');
        this.minesCounterElement = document.querySelector('.mines-counter');
        this.timerElement = document.querySelector('.timer');
        this.scoreElement = document.getElementById('scoreValue');
        this.bestScoreElement = document.getElementById('bestScoreValue');
        this.abilitiesPanel = document.getElementById('abilitiesPanel');
        this.levelInfoElement = document.getElementById('levelInfo');
        
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.initializeGame();
        this.updateScoreDisplay();
        this.updateLevelInfo();
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
                
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e));
                
                // Добавляем обработку долгого нажатия для мобильных устройств
                let pressTimer;
                cell.addEventListener('touchstart', (e) => {
                    pressTimer = setTimeout(() => {
                        e.preventDefault();
                        this.handleRightClick(e);
                    }, 500);
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
    
    // В методе createAbilitiesPanel() замените код на следующий:

createAbilitiesPanel() {
    this.unlockedAbilities = this.levelSystem.getUnlockedAbilities();
    
    this.abilitiesPanel.innerHTML = ''; // Очищаем панель способностей
    
    this.unlockedAbilities.forEach(ability => {
        const abilityElement = document.createElement('div');
        abilityElement.className = 'ability';
        abilityElement.id = `ability-${ability.key}`;
        abilityElement.innerHTML = `
            <div class="ability-icon">${ability.icon}</div>
            <div class="ability-name">${ability.name}</div>
            <div class="ability-level">Ур. ${ability.level}</div>
            <div class="ability-uses">Исп.: ${ability.uses}</div>
        `;
        
        abilityElement.addEventListener('click', () => this.useAbility(ability.key));
        this.abilitiesPanel.appendChild(abilityElement);
    });
    
    this.updateAbilitiesPanel();
}
    
    updateAbilitiesPanel() {
        this.unlockedAbilities.forEach(ability => {
            const abilityElement = document.getElementById(`ability-${ability.key}`);
            if (abilityElement) {
                const usesElement = abilityElement.querySelector('.ability-uses');
                usesElement.textContent = `Исп.: ${ability.uses}`;
                
                abilityElement.classList.remove('disabled');
                if (ability.uses <= 0 || this.gameOver || this.gameWon) {
                    abilityElement.classList.add('disabled');
                }
            }
        });
    }
    
    useAbility(abilityKey) {
        const ability = this.unlockedAbilities.find(a => a.key === abilityKey);
        if (!ability || ability.uses <= 0 || this.gameOver || this.gameWon) {
            this.showMessage("Способность недоступна!");
            return;
        }
        
        switch(abilityKey) {
            case 'scanner':
                this.useScanner();
                break;
            case 'shield':
                this.showMessage("Щит активируется автоматически при взрыве!");
                return;
            case 'hint':
                this.useHint();
                break;
            case 'telepathy':
                this.useTelepathy();
                break;
            case 'timeShield':
                this.useTimeShield();
                break;
            case 'magnetism':
                this.useMagnetism();
                break;
        }
        
        // Уменьшаем количество использований
        this.userData.abilities[abilityKey].uses--;
        this.gameData.updateUserData(this.userData);
        this.updateAbilitiesPanel();
    }
    
    useScanner() {
        const mines = this.mines;
        if (mines.length === 0) return;
        
        const shownMines = mines.slice(0, Math.min(3, mines.length));
        
        shownMines.forEach(mine => {
            const cell = this.board[mine.row][mine.col].element;
            cell.classList.add('scanner-highlight');
        });
        
        setTimeout(() => {
            shownMines.forEach(mine => {
                const cell = this.board[mine.row][mine.col].element;
                cell.classList.remove('scanner-highlight');
            });
        }, 3000);
        
        this.showMessage("Сканер показывает ближайшие мины!");
    }
    
    useHint() {
        const safeCells = [];
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = this.board[i][j];
                if (!cell.isRevealed && !cell.isMine && !cell.isFlagged) {
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
            const randomIndex = Math.floor(Math.random() * safeCells.length);
            const hintCell = safeCells[randomIndex];
            const cellElement = this.board[hintCell.row][hintCell.col].element;
            
            cellElement.classList.add('highlighted');
            
            setTimeout(() => {
                cellElement.classList.remove('highlighted');
            }, 2000);
            
            this.showMessage("Подсказка показывает безопасную клетку!");
        } else {
            this.showMessage("Нет доступных подсказок!");
        }
    }
    
    useTelepathy() {
        this.mines.forEach(mine => {
            const cell = this.board[mine.row][mine.col].element;
            cell.classList.add('scanner-highlight');
        });
        
        setTimeout(() => {
            this.mines.forEach(mine => {
                const cell = this.board[mine.row][mine.col].element;
                cell.classList.remove('scanner-highlight');
            });
        }, 5000);
        
        this.showMessage("Телепатия показывает все мины!");
    }
    
    useTimeShield() {
        this.showMessage("Время замедлено!");
        // Визуальный эффект замедления
        document.body.style.animation = 'slowMotion 10s infinite';
    }
    
    useMagnetism() {
        const safeCells = [];
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = this.board[i][j];
                if (!cell.isRevealed && !cell.isMine && !cell.isFlagged) {
                    safeCells.push({row: i, col: j});
                }
            }
        }
        
        // Открываем 3 случайные безопасные клетки
        for (let i = 0; i < Math.min(3, safeCells.length); i++) {
            const randomIndex = Math.floor(Math.random() * safeCells.length);
            const cellToReveal = safeCells[randomIndex];
            this.revealCell(cellToReveal.row, cellToReveal.col);
            safeCells.splice(randomIndex, 1);
        }
        
        this.showMessage("Магнетизм открыл 3 безопасные клетки!");
        
        // Проверяем победу
        if (this.revealedCount === (this.rows * this.cols - this.minesCount)) {
            this.endGame(true);
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
            
            if ((row === excludeRow && col === excludeCol) || this.board[row][col].isMine) {
                continue;
            }
            
            this.board[row][col].isMine = true;
            this.mines.push({row, col});
            minesPlaced++;
            
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
        event.preventDefault();
        
        if (this.gameOver || this.gameWon) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) return;
        
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }
        
        if (cell.isMine) {
            // Проверяем, активен ли щит
            const shieldAbility = this.userData.abilities.shield;
            if (shieldAbility && shieldAbility.uses > 0) {
                this.userData.abilities.shield.uses--;
                this.gameData.updateUserData(this.userData);
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
        
        if (this.revealedCount === (this.rows * this.cols - this.minesCount)) {
            this.endGame(true);
        }
    }
    
    // В методе handleRightClick() добавьте проверку event.preventDefault()
handleRightClick(event) {
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
        
        let points = 0;
        if (isWin) {
            points = Math.max(10, 200 - this.timer);
            this.showMessage(`Победа! +${points} очков!`);
        }
        
        // Обновляем статистику
        this.levelSystem.updateStats(isWin, this.timer, points, this.revealedCount);
        
        this.userData.totalScore += points;
        this.gameData.updateUserData(this.userData);
        
        this.updateScoreDisplay();
        this.updateLevelInfo();
        this.updateAbilitiesPanel();
        
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
            scoreText.innerHTML = `Очки: <strong>${points}</strong><br>Всего: <strong>${this.userData.totalScore}</strong>`;
            scoreText.style.fontSize = '16px';
            scoreText.style.margin = '10px 0';
            
            const levelUpInfo = document.createElement('p');
            const levelInfo = this.levelSystem.getLevelInfo();
            levelUpInfo.innerHTML = `Уровень: <strong>${levelInfo.currentLevel}</strong><br>
                                   XP: <strong>${levelInfo.currentXP}/${levelInfo.xpToNextLevel}</strong>`;
            levelUpInfo.style.fontSize = '14px';
            levelUpInfo.style.margin = '10px 0';
            
            const resetButton = document.createElement('button');
            resetButton.textContent = 'Новая игра';
            resetButton.addEventListener('click', () => {
                document.body.removeChild(gameOverDiv);
                this.resetGame();
            });
            
            contentDiv.appendChild(title);
            contentDiv.appendChild(timeText);
            contentDiv.appendChild(scoreText);
            contentDiv.appendChild(levelUpInfo);
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
        this.scoreElement.textContent = this.userData.totalScore;
        this.bestScoreElement.textContent = this.userData.bestTime || '0';
    }
    
    updateLevelInfo() {
        const levelInfo = this.levelSystem.getLevelInfo();
        if (this.levelInfoElement) {
            this.levelInfoElement.innerHTML = `
                <div>Уровень: ${levelInfo.currentLevel}</div>
                <div>XP: ${levelInfo.currentXP}/${levelInfo.xpToNextLevel}</div>
                <div style="width:100%;background:#444;height:5px;margin:5px 0">
                    <div style="width:${levelInfo.progress}%;background:#4CAF50;height:100%"></div>
                </div>
            `;
        }
    }
    
    showMessage(text) {
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
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
