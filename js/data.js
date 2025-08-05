// Система данных для игры
class GameData {
    constructor() {
        this.userData = this.loadUserData();
    }
    
    // Структура данных пользователя
    getDefaultUserData() {
        return {
            userId: this.generateUserId(),
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            totalScore: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            bestTime: null,
            abilities: {
                scanner: { level: 1, uses: 1 },
                shield: { level: 1, uses: 1 },
                hint: { level: 1, uses: 3 }
            },
            unlockedAbilities: ['scanner', 'shield', 'hint'],
            achievements: [],
            settings: {
                sound: true,
                vibrations: true
            }
        };
    }
    
    // Генерация уникального ID пользователя
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Загрузка данных пользователя
    loadUserData() {
        // Пока используем localStorage для демонстрации
        const savedData = localStorage.getItem('minesweeper_user_data');
        if (savedData) {
            return JSON.parse(savedData);
        }
        return this.getDefaultUserData();
    }
    
    // Сохранение данных пользователя
    saveUserData() {
        localStorage.setItem('minesweeper_user_data', JSON.stringify(this.userData));
    }
    
    // Получение данных пользователя
    getUserData() {
        return this.userData;
    }
    
    // Обновление данных пользователя
    updateUserData(newData) {
        this.userData = { ...this.userData, ...newData };
        this.saveUserData();
    }
    
    // Добавление XP
    addXP(xp) {
        this.userData.xp += xp;
        this.checkLevelUp();
        this.saveUserData();
    }
    
    // Проверка повышения уровня
    checkLevelUp() {
        if (this.userData.xp >= this.userData.xpToNextLevel) {
            this.userData.level++;
            this.userData.xp -= this.userData.xpToNextLevel;
            this.userData.xpToNextLevel = Math.floor(this.userData.xpToNextLevel * 1.5);
            this.unlockNewAbilities();
            return true;
        }
        return false;
    }
    
    // Разблокировка новых способностей
    unlockNewAbilities() {
        const newAbilities = {
            5: 'telepathy',    // Телепатия
            10: 'timeShield',  // Временной щит
            15: 'magnetism'    // Магнетизм
        };
        
        if (newAbilities[this.userData.level]) {
            const ability = newAbilities[this.userData.level];
            if (!this.userData.unlockedAbilities.includes(ability)) {
                this.userData.unlockedAbilities.push(ability);
                this.userData.abilities[ability] = { level: 1, uses: 1 };
            }
        }
    }
    
    // Получение информации о способностях по уровню
    getAbilityInfo(abilityKey, userLevel) {
        const abilities = {
            scanner: {
                name: "Сканер",
                icon: "🔍",
                description: "Показывает ближайшие мины",
                cost: 50,
                baseUses: 1,
                levelUp: "Увеличивает количество сканирований"
            },
            shield: {
                name: "Щит",
                icon: "🛡️",
                description: "Защита от взрыва",
                cost: 100,
                baseUses: 1,
                levelUp: "Увеличивает количество использований"
            },
            hint: {
                name: "Подсказка",
                icon: "💡",
                description: "Показывает безопасную клетку",
                cost: 30,
                baseUses: 3,
                levelUp: "Увеличивает количество подсказок"
            },
            telepathy: {
                name: "Телепатия",
                icon: "🧠",
                description: "Показывает все мины на 5 секунд",
                cost: 200,
                baseUses: 1,
                levelUp: "Увеличивает время показа"
            },
            timeShield: {
                name: "Временной щит",
                icon: "⏳",
                description: "Замедляет время на 10 секунд",
                cost: 150,
                baseUses: 2,
                levelUp: "Увеличивает время замедления"
            },
            magnetism: {
                name: "Магнетизм",
                icon: "🧲",
                description: "Открывает 3 безопасные клетки",
                cost: 180,
                baseUses: 1,
                levelUp: "Увеличивает количество открываемых клеток"
            }
        };
        
        return abilities[abilityKey] || null;
    }
}
