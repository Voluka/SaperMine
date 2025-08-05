// Система уровней и прокачки
class LevelSystem {
    constructor(gameData) {
        this.gameData = gameData;
        this.userData = gameData.getUserData();
    }
    
    // Расчет XP за победу
    calculateXPForWin(time, score) {
        // Базовый XP + бонус за быстрое прохождение + бонус за очки
        let baseXP = 50;
        let timeBonus = Math.max(0, 100 - time);
        let scoreBonus = Math.floor(score / 10);
        return baseXP + timeBonus + scoreBonus;
    }
    
    // Расчет XP за игру (даже при проигрыше)
    calculateXPForGame(time, revealedCells) {
        // Минимальный XP за участие
        let baseXP = 10;
        let timeXP = Math.floor(time / 10);
        let cellsXP = Math.floor(revealedCells / 2);
        return baseXP + timeXP + cellsXP;
    }
    
    // Обновление статистики после игры
    updateStats(isWin, time, score, revealedCells) {
        this.userData.gamesPlayed++;
        
        if (isWin) {
            this.userData.gamesWon++;
            const xp = this.calculateXPForWin(time, score);
            this.gameData.addXP(xp);
            
            // Обновление лучшего времени
            if (!this.userData.bestTime || time < this.userData.bestTime) {
                this.userData.bestTime = time;
            }
        } else {
            const xp = this.calculateXPForGame(time, revealedCells);
            this.gameData.addXP(xp);
        }
        
        // Обновление общего счета
        this.userData.totalScore += score;
        
        this.gameData.updateUserData(this.userData);
    }
    
    // Получение информации о текущем уровне
    getLevelInfo() {
        return {
            currentLevel: this.userData.level,
            currentXP: this.userData.xp,
            xpToNextLevel: this.userData.xpToNextLevel,
            progress: Math.floor((this.userData.xp / this.userData.xpToNextLevel) * 100)
        };
    }
    
    // Получение всех разблокированных способностей
    getUnlockedAbilities() {
        return this.userData.unlockedAbilities.map(abilityKey => {
            const info = this.gameData.getAbilityInfo(abilityKey, this.userData.level);
            const userAbility = this.userData.abilities[abilityKey];
            return {
                key: abilityKey,
                ...info,
                level: userAbility ? userAbility.level : 1,
                uses: userAbility ? userAbility.uses : 0
            };
        });
    }
    
    // Повышение уровня способности
    levelUpAbility(abilityKey) {
        if (!this.userData.unlockedAbilities.includes(abilityKey)) return false;
        
        const abilityInfo = this.gameData.getAbilityInfo(abilityKey, this.userData.level);
        const userAbility = this.userData.abilities[abilityKey];
        const cost = abilityInfo.cost * userAbility.level;
        
        if (this.userData.totalScore >= cost) {
            this.userData.abilities[abilityKey].level++;
            this.userData.abilities[abilityKey].uses++;
            this.userData.totalScore -= cost;
            this.gameData.updateUserData(this.userData);
            return true;
        }
        return false;
    }
}
