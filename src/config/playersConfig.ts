/**
 * 玩家初始化配置
 * 每个玩家有4个主题，每个主题下有35~50张照片
 */

// 动态生成照片路径的辅助函数
function generatePhotoPaths(playerName: string, themeName: string, count: number): string[] {
    return Array.from({ length: count }, (_, i) =>
        `/${playerName}/${themeName}/${i + 1}.jpg`
    )
}

export interface PlayerConfig {
    name: string
    themes: {
        name: string
        photos: string[] // 照片URL或路径
        isConsumed: boolean
    }[]
}

export const playersConfig: PlayerConfig[] = [
    {
        name: '冠維',
        themes: [
            {
                name: '美食',
                photos: generatePhotoPaths('冠維', '美食', 2),
                isConsumed: false
            },
            {
                name: '寵物',
                photos: generatePhotoPaths('冠維', '寵物', 1),
                isConsumed: false
            },
            {
                name: '風景',
                photos: generatePhotoPaths('冠維', '風景', 1),
                isConsumed: false
            },
            {
                name: '運動',
                photos: generatePhotoPaths('冠維', '運動', 1),
                isConsumed: false
            }
        ]
    }
]
