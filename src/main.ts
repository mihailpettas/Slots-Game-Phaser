import * as Phaser from 'phaser'

class SlotGame extends Phaser.Scene {
    private spinButton!: Phaser.GameObjects.Text
    private winAmountText!: Phaser.GameObjects.Text
    private reels!: Phaser.GameObjects.Group[]
    private symbols = [
        '9', '9_connect', '10', '10_connect', 'A', 'A_connect', 'BONUS',
        'H1', 'H1_connect', 'H2', 'H2_connect', 'H3', 'H3_connect', 'H4',
        'H4_connect', 'H5', 'H5_connect', 'H6', 'H6_connect', 'J',
        'J_connect', 'K', 'K_connect', 'M1', 'M1_connect', 'M2',
        'M2_connect', 'M3', 'M3_connect', 'M4', 'M4_connect', 'M5',
        'M5_connect', 'M6', 'M6_connect', 'Q', 'Q_connect'
    ];

    constructor() {
        super('SlotGame')
    }

    preload() {
        for (const symbol of this.symbols) {
            this.load.image(symbol, `assets/${symbol}.png`)
        }
    }

    create() {
        this.reels = this.createReels()

        this.spinButton = this.add.text(this.scale.width / 2, this.scale.height - 50, 'SPIN', { fontSize: '32px', color: '#ffffff' })
        this.spinButton.setOrigin(0.5)
        this.spinButton.setInteractive()
        this.spinButton.on('pointerdown', () => this.spinReels())

        this.winAmountText = this.add.text(this.scale.width / 2, this.scale.height - 100, 'Win Amount: 0', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5)

        // Remove extra canvas
        const canvases = document.getElementsByTagName('canvas')
        if (canvases.length > 1) {
            for (let i = 1; i < canvases.length; i++) {
                canvases[i].parentNode?.removeChild(canvases[i])
            }
        }
    }

    private createReels(): Phaser.GameObjects.Group[] {
        const reels = []
        const reelWidth = 100
        const symbolHeight = 100
        const startX = (this.scale.width - reelWidth * 5) / 2
        const startY = (this.scale.height - symbolHeight * 3) / 2
        const scale = 0.5

        for (let i = 0; i < 5; i++) {
            const reel = this.add.group()
            for (let j = 0; j < 3; j++) {
                const symbol = this.add.sprite(startX + i * reelWidth, startY + j * symbolHeight, Phaser.Math.RND.pick(this.getNormalSymbols()))
                symbol.setScale(scale)
                reel.add(symbol)
            }
            reels.push(reel)
        }
        return reels
    }

    private getNormalSymbols(): string[] {
        return this.symbols.filter(symbol => !symbol.includes('_connect'))
    }

    private getConnectSymbol(symbol: string): string {
        return symbol + '_connect'
    }

    private spinReels() {
        const reelDuration = 500
        const staggerDelay = 100

        for (let i = 0; i < this.reels.length; i++) {
            const reel = this.reels[i]
            reel.children.iterate((symbol: Phaser.GameObjects.GameObject, index: number) => {
                const sprite = symbol as Phaser.GameObjects.Sprite

                this.tweens.add({
                    targets: sprite,
                    y: sprite.y + 200,
                    ease: 'Power1',
                    duration: reelDuration,
                    delay: i * staggerDelay + index * 50,
                    onComplete: () => {
                        sprite.y -= 200
                        sprite.setTexture(Phaser.Math.RND.pick(this.getNormalSymbols()))
                    }
                })
                return true
            })
        }

        this.time.delayedCall(reelDuration + staggerDelay * this.reels.length, () => {
            this.evaluateWin()
        })
    }

    private evaluateWin() {
        let winAmount = 0

        const matchedSymbols = this.checkWinningCombinations()

        matchedSymbols.forEach(match => {
            winAmount += 10 * match.count
            match.indices.forEach(index => this.replaceWithConnectSymbol(index))
        })

        console.log(`Win Amount: ${winAmount}`)
        this.winAmountText.setText(`Win Amount: ${winAmount}`)
    }

    private checkWinningCombinations() {
        const matchedSymbols: { symbol: string, count: number, indices: number[] }[] = []

        for (let row = 0; row < 3; row++) {
            let col = 0
            while (col < 5) {
                const symbol = this.getSymbolAtPosition(row, col)
                if (symbol) {
                    let count = 1
                    const indices = [row * 5 + col]

                    for (let nextCol = col + 1; nextCol < 5; nextCol++) {
                        const nextSymbol = this.getSymbolAtPosition(row, nextCol)
                        if (nextSymbol === symbol) {
                            count++
                            indices.push(row * 5 + nextCol)
                        } else {
                            break
                        }
                    }

                    if (count >= 3) {
                        matchedSymbols.push({ symbol, count, indices })
                    }
                    col += count
                } else {
                    col++
                }
            }
        }

        return matchedSymbols
    }

    private replaceWithConnectSymbol(index: number) {
        const reelIndex = Math.floor(index % 5)
        const symbolIndex = Math.floor(index / 5)
        const symbol = this.reels[reelIndex].getChildren()[symbolIndex] as Phaser.GameObjects.Sprite
        if (symbol) {
            const connectSymbol = this.getConnectSymbol(symbol.texture.key)
            if (this.textures.exists(connectSymbol)) {
                symbol.setTexture(connectSymbol)
            }
        }
    }

    private getSymbolAtPosition(row: number, col: number): string | null {
        const symbol = this.reels[col].getChildren()[row] as Phaser.GameObjects.Sprite
        return symbol ? symbol.texture.key : null
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: SlotGame,
    parent: 'game-container'
}

const game = new Phaser.Game(config)
