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
        photos: string[] // 照片URL
        answers: string[] // 答案
        isConsumed: boolean
    }[]
}

export interface HostThemeConfig {
    name: string
    photos: string[]
    answers: string[]
}

export const hostConfig: HostThemeConfig[] = [
    {
        name: '角落生物',
        photos: generatePhotoPaths('主持人', '角落生物', 48),
        answers: ['答案1', '答案2']
    },
    {
        name: '寵物',
        photos: generatePhotoPaths('主持人', '寵物', 48),
        answers: ['答案1']
    },
    {
        name: '風景',
        photos: generatePhotoPaths('主持人', '風景',    48),
        answers: ['答案1']
    },
    {
        name: '運動',
        photos: generatePhotoPaths('主持人', '運動', 48),
        answers: ['答案1']
    }
]

export const playersConfig: PlayerConfig[] = [
    {
        name: '李長鴻',
        themes: [
            {
                name: '美國卡通',
                photos: generatePhotoPaths('李長鴻', '美國卡通', 30),
                answers: ['答案1', '答案2'],
                isConsumed: false
            },
            {
                name: '單機遊戲',
                photos: generatePhotoPaths('李長鴻', '單機遊戲', 30),
                answers: ['答案3'],
                isConsumed: false
      
            },
            {
                name: '希臘神話人物',
                photos: generatePhotoPaths('李長鴻', '希臘神話人物', 30),
                answers: ['答案4'],
                isConsumed: false
            },
            {
                name: '哲學家語錄',
                photos: generatePhotoPaths('李長鴻', '哲學家語錄', 30),
                answers: ['答案5'],
                isConsumed: false
            }
        ]
    },
    {
        name: '怡臻',
        themes: [
            {
                name: '後宮甄嬛傳經典臺詞',
                photos: generatePhotoPaths('怡臻', '後宮甄嬛傳經典臺詞', 30),
                answers: ['答案1', '答案2'],
                isConsumed: false
            },
            {
                name: '食物',
                photos: generatePhotoPaths('怡臻', '食物', 30),
                answers: ['答案3'],
                isConsumed: false
      
            },
            {
                name: '動漫',
                photos: generatePhotoPaths('怡臻', '動漫', 30),
                answers: ['答案4'],
                isConsumed: false
            },
            {
                name: '彩妝',
                photos: generatePhotoPaths('怡臻', '彩妝', 35),
                answers: ['答案5'],
                isConsumed: false
            }
            
        ]
    },
    {
        name: '逸弘',
        themes: [
            {
                name: '國家對首都',
                photos: generatePhotoPaths('逸弘', '國家對首都', 48),
                answers: ['答案1', '答案2'],
                isConsumed: false
            },
            {
                name: '遊戲王角色',
                photos: generatePhotoPaths('逸弘', '遊戲王角色', 48),
                answers: ['答案3'],
                isConsumed: false
      
            },
            {
                name: '臺灣老歌歌手',
                photos: generatePhotoPaths('逸弘', '臺灣老歌歌手', 48),
                answers: ['答案4'],
                isConsumed: false
            },
            {
                name: '臺灣政治人物',
                photos: generatePhotoPaths('逸弘', '臺灣政治人物', 48),
                answers: ['答案5'],
                isConsumed: false
            }

        ]
        },
            {
        name: '戴笠',
        themes: [
            {
                name: '文化節慶',
                photos: generatePhotoPaths('戴笠', '文化節慶', 48),
                answers: ['答案1', '答案2'],
                isConsumed: false
            },
            {
                name: '世界知名自然景觀',
                photos: generatePhotoPaths('戴笠', '世界知名自然景觀', 48),
                answers: ['答案3'],
                isConsumed: false
      
            },
            {
                name: '宗教神祇',
                photos: generatePhotoPaths('戴笠', '宗教神祇', 48),
                answers: ['答案4'],
                isConsumed: false
            },
            {
                name: '動植物',
                photos: generatePhotoPaths('戴笠', '動植物', 48),
                answers: ['答案5'],
                isConsumed: false
            }

        ]
        },

        {
        name: 'VJ',
        themes: [
            {
                name: '西方奇幻小說',
                photos: generatePhotoPaths('VJ', '西方奇幻小說', 48),
                answers: ['答案1', '答案2'],
                isConsumed: false
            },
            {
                name: '電腦遊戲',
                photos: generatePhotoPaths('VJ', '電腦遊戲', 48),
                answers: ['答案3'],
                isConsumed: false
      
            },
            {
                name: '網路迷因',
                photos: generatePhotoPaths('VJ', '網路迷因', 48),
                answers: ['答案4'],
                isConsumed: false
            },
            {
                name: 'pending',
                photos: generatePhotoPaths('VJ', 'pending', 48),
                answers: ['答案5'],
                isConsumed: false
            }

        ]
        }
]
