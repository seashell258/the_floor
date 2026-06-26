/**
 * 玩家初始化配置
 * 每个玩家有4个主题，每个主题下有35~50张照片
 */

// 動態生成照片 base 路徑（不含副檔名），由渲染端依 avif > webp > jpg > png > jpeg 偏好順序選用
function generatePhotoPaths(playerName: string, themeName: string, count: number): string[] {
    return Array.from({ length: count }, (_, i) =>
        `/${playerName}/${themeName}/${i + 1}`
    )
}

export interface PlayerConfig {
    name: string
    themes: {
        name: string
        photos: string[] // 照片URL
        answers: string[] // 答案
        isConsumed: boolean
        isActivated: boolean
    }[]
}

export interface HostThemeConfig {
    name: string
    photos: string[]
    answers: string[]
    isActivated: boolean
}

export const hostConfig: HostThemeConfig[] = [
    { name: '角落生物', photos: generatePhotoPaths('主持人', '角落生物', 18), answers: ['白熊','企鵝?','貓','蜥蜴','炸蝦尾','粉圓','裹布','偽蝸牛','麻雀','幽靈','蜥蜴的母親','狗','蘑菇','例子','炸豬排國王','飛碟','炸豬排','黑色粉圓'], isActivated: true },
    { name: '動漫角色猜日本聲優',     photos: generatePhotoPaths('主持人', '動漫角色猜日本聲優',     30), answers: [
    "孫悟空 野沢雅子",
    "蒙奇·D·魯夫 田中真弓",
    "漩渦鳴人 竹内順子",
    "月野兔（水手月亮） 三石琴乃",
    "皮卡丘 大谷育江",
    "哆啦A夢 水田わさび",
    "野原新之助（小新） 矢島晶子",
    "碇真嗣 緒方恵美",
    "綾波零 林原めぐみ",
    "江戶川柯南 高山みなみ",
    "夜神月 宮野真守",
    "L 山口勝平",
    "愛德華·艾爾利克 朴璐美",
    "竈門炭治郎 花江夏樹",
    "五條悟 中村悠一",
    "艾連·葉卡 梶裕貴",
    "黑崎一護 森田成一",
    "坂田銀時 杉田智和",
    "涼宮春日 平野綾",
    "惣流·明日香·蘭格雷 宮村優子",
    "黎歐拉殊·蘭普路基 福山潤",
    "宇智波佐助 杉山紀彰",
    "羅羅諾亞·索隆 中井和哉",
    "曉美焰 齋藤千和",
    "李維 神谷浩史",
    "空條承太郎 小野大輔",
    "史派克·史比格爾 山寺宏一",
    "木之本櫻 丹下桜",
    "鹿目圓 悠木碧",
    "雷姆 水瀬いのり"
],          isActivated: true },
    { name: '美劇',     photos: generatePhotoPaths('主持人', '美劇',     30), answers: [
    "Breaking Bad 絕命毒師",
    "The Sopranos 黑道家族",
    "Game of Thrones 冰與火之歌：權力遊戲",
    "Friends 六人行",
    "The Office 辦公室（美版）",
    "Seinfeld 宋飛正傳",
    "The Wire 火線重案組",
    "Lost LOST檔案",
    "House 怪醫豪斯",
    "24 24小時(圖片上有寫24 所以要講24小時才算對)",
    "Stranger Things 怪奇物語",
    "The Walking Dead 陰屍路",
    "Dexter 天才魔法師",
    "Grey's Anatomy 實習醫生葛雷",
    "ER 急診室的春天",
    "The X-Files X檔案",
    "CSI Crime Scene Investigation CSI犯罪現場",
    "Desperate Housewives 慾望師奶",
    "Prison Break 越獄",
    "Homeland 反恐危機",
    "True Detective 真實的偵探",
    "Mad Men 廣告狂人",
    "Better Call Saul 絕命律師",
    "Succession 繼承之戰",
    "Westworld 西方極樂園",
    "Fringe 危機邊緣",
    "Supernatural 邪惡力量",
    "Sons of Anarchy 飆風巡邏隊",
    "Boardwalk Empire 海濱帝國",
    "American Horror Story 美國恐怖故事"
],          isActivated: true },
    { name: '測試用',     photos: generatePhotoPaths('主持人', '測試用',     38), answers: [], isActivated: true },
{ name: '飢餓遊戲角色',     photos: generatePhotoPaths('主持人', '飢餓遊戲角色',14), answers: [  "Katniss Everdeen 凱妮絲・艾佛丁",
  "Peeta Mellark 比德・梅爾拉克",
  "Gale Hawthorne 蓋爾・霍桑",
  "Effie Trinket 艾菲・純克",
  "Haymitch Abernathy 黑密契・亞伯納西",
  "President Snow 史諾總統",
  "Plutarch Heavensbee 普魯塔克・希文斯比",
  "Caesar Flickerman 凱薩・弗利克曼",
  "Primrose Everdeen 波麗姆・艾佛丁（Prim）",
  "Finnick Odair 芬尼克・歐戴爾",
  "Johanna Mason 喬安娜・梅森",
  "Alma Coin 艾瑪・柯茵",
  "Cinna 秦納",
  "Rue 小芸"
], isActivated: true },
{ name: '食材',                 photos: generatePhotoPaths('主持人', '食材',                 30), answers: ["茭白筍","龍鬚菜","山蘇","過貓（蕨菜）","大白菜","青江菜","香菇","金針菇","豬五花","雞腿肉","豬絞肉","牛腩","豬梅花肉","雞翅","虱目魚","透抽","蛤蜊","牡蠣","白蝦","花枝","板豆腐","豆干","油豆腐","嫩豆腐","米粉","地瓜","芋頭","冬粉","九層塔","薑"], isConsumed: false, isActivated: true },
,{ name: '廚具',                 photos: generatePhotoPaths('主持人', '廚具',                 30), answers: ["主廚刀","麵包刀","削皮刀","砧板","剪刀","炒鍋","湯鍋","平底鍋","蒸鍋","壓力鍋","烤盤","鑄鐵鍋","量杯","量匙","料理秤","溫度計","電動打蛋器","橡皮刮刀","木匙","夾子","漏杓","篩網／濾網","研磨缽","電鍋","果汁機／調理機","微波爐","氣炸鍋","烤箱","擀麵棍","開罐器"], isConsumed: false, isActivated: true },
           
]


export const playersConfig: PlayerConfig[] = [
    {
        name: '李怡臻',
        themes: [
            { name: '動漫',                 photos: generatePhotoPaths('李怡臻', '動漫',                 50), answers: ['航海王','我的英雄學院','鋼之煉金術師','暗殺教室','死神','櫻蘭高校男公關部','冰上的尤里','東京喰種','火影忍者','葬送的芙莉蓮','進擊的巨人','斬．赤紅之瞳','魔法科高校的劣等生','咒術迴戰','鬼滅之刃','刀劍神域','狼與辛香料','魔法禁書目錄','排球少年','名偵探柯南','某科學的超電磁砲','小林家的龍女僕','笨蛋測驗召喚獸','月刊少女野崎同學','搖曳露營','珍珠美人魚','數碼寶貝','精靈寶可夢','遊戲王','戰鬥陀螺','冰菓','新世紀福音戰士','魔法少女小圓','獵人','灌籃高手','棋靈王','棒球大聯盟','love live','反叛的魯路修','庫洛魔法使','小松先生','請問您今天要來點兔子嗎？','銀魂','機動戰士鋼彈 水星的魔女','夏目友人帳','K-on 輕音部','涼宮春日的憂鬱','吹響吧！上低音號','Lycoris 莉可莉絲','四月是你的謊言'], isConsumed: false, isActivated: true },
            { name: '後宮甄嬛傳臺詞',       photos: generatePhotoPaths('李怡臻', '後宮甄嬛傳臺詞',       32), answers: ['情愛與時光','賤人就是矯情','做不到','驚喜','駕崩','也不該拿別人的血來暖自己','苦杏仁','暖暖','看戲','提鞋','會咬人的狗','榮華富貴','氣度，本事','亮光','掛記','人能容你','出人頭地','變成啞巴','鬆口氣','昭告天下','好東西','好生熱鬧','心有餘而力不足','筋疲力盡','等死','新鮮','去死','福氣','你在做什麼','皇后娘娘','到頭','笑不出來'],          isConsumed: false, isActivated: true },
            { name: '彩妝',                 photos: generatePhotoPaths('李怡臻', '彩妝',                 30), answers: ['口紅（唇膏）','粉餅','眼影盤','腮紅','美妝蛋','唇釉','粉底液','睫毛膏','修容盤','海綿','唇蜜','粉底棒','眉筆','打亮','睫毛夾','護唇膏','粉餅','假睫毛','Bronzer','粉撲','唇膜','遮瑕膏','雙眼皮貼','粉撲','唇部打底','妝前乳','眼皮打底','捲翹器','唇線筆','修眉刀'],          isConsumed: false, isActivated: true },
            { name: '食物',                 photos: generatePhotoPaths('李怡臻', '食物',                 30), answers: ['墨西哥 taco','duck confit 油封鴨','可樂餅','千層麵','威靈頓牛排','千層酥','牛舌','避風塘炒蟹','戰斧牛排','火山排骨','芋頭飯  / 芋仔籤','大阪燒','土耳其烤肉 或 沙威馬','班尼迪克蛋','千層蛋糕','北京烤鴨','千層麵','烤乳豬','德國豬腳','烤火雞','炸魚薯條','閃電泡芙','吉拿棒','章魚燒','墨西哥玉米片','法國麵包','鳳梨酥','糖葫蘆串','粽子','關東煮'],          isConsumed: false, isActivated: false }
       
        ]
    },
    {
        name: '逸弘',
        themes: [
            { name: '臺灣政治人物', photos: generatePhotoPaths('逸弘', '臺灣政治人物', 50), answers: ['王世堅','鄭麗文','朱立倫','蔡英文','賴清德','陳水扁','柯文哲','吳怡農','吳音寧','蔣萬安','韓國瑜','陳其邁','林佳龍','葉元之','徐巧芯','王鴻薇','莊瑞雄','林月琴','沈柏洋','張啟楷','萬美玲','陳昭姿','馬英九','王金平','黃捷','金溥聰','吳沛憶','郭國文','陳亭妃','謝龍介','鄭運鵬','柯志恩','盧秀燕','江啟臣','蔡其昌','蘇貞昌','蘇巧慧','李四川','黃國昌','陳智菡','黃靜儀','羅智強','趙少康','張善政','鄭文燦','陳菊','陳柏惟','黃珊珊','王婉諭','李登輝'], isConsumed: false, isActivated: true },
            { name: '遊戲王動漫角色', photos: generatePhotoPaths('逸弘', '遊戲王動漫角色', 30), answers: ['武藤遊戲','真崎杏子','城之內克也','本田弘人（廣）','御伽龍兒','海馬瀨人','海馬圭平','孔雀舞','貘良了','馬立克．伊修達爾','川井靜香','野坂美穗','武藤雙六','海馬剛三郎','磯野','大岡筑前','太田總一郎（大田宗一郎）','昆蟲流羽蛾','梶木漁太','奇士．霍華德（盜賊奇士）','鬼骨塚','貝克斯．J．克羅佛多','迷宮兄弟','伊西絲．伊修達爾','天才絽場','光之假面＆闇之假面','蕾貝卡．波普奇士','瓦龍','薇薇安．翁','奇古．羅伊德'],          isConsumed: false, isActivated: true },
            { name: '看國家講首都名字', photos: generatePhotoPaths('逸弘', '看國家講首都名字', 48), answers: ['馬尼拉','首爾','北京','華盛頓','渥太華','墨西哥城','巴西利亞','布宜諾斯艾利斯','聖地牙哥','倫敦','巴黎','柏林','羅馬','馬德里','里斯本','阿姆斯特丹','布魯塞爾','伯恩','維也納','哥本哈根','斯德哥爾摩','奧斯陸','赫爾辛基','雷克雅維克','華沙','布拉格','布達佩斯','雅典','安卡拉','莫斯科','基輔','新德里','伊斯蘭馬巴德','曼谷','河內','新加坡','吉隆坡','雅加達','坎培拉','威靈頓','開羅','普勒托利亞','阿布加','奈洛比','利雅德','阿布達比','耶路撒冷','德黑蘭'],          isConsumed: false, isActivated: true },
            { name: '臺灣老歌歌手', photos: generatePhotoPaths('逸弘', '臺灣老歌歌手', 34), answers: ['陳淑樺','洪榮宏','潘越雲','黃乙玲','羅大佑','文夏','齊秦','蔡琴','陳雷','鳳飛飛','動力火車','張雨生','林志炫','齊豫','黃鶯鶯','周華健','葉啟田','秀蘭瑪雅','蘇芮','江蕙','施文彬','費玉清','林慧萍','陳小雲','王傑','鍾興民','林生祥','黃連煜','鄧麗君','江淑娜','洪愛莉','蔡秋鳳','張清芳','方瑞娥'],          isConsumed: false, isActivated: false }
        ]
    },
    {
        name: '李長鴻',
        themes: [
            { name: '單機遊戲', photos: generatePhotoPaths('李長鴻', '單機遊戲', 40), answers: ['殺戮尖塔 Slay the Spire','超級瑪利歐兄弟','皮卡丘打排球','巫師3 The Witcher','麥塊 Mine Craft','薩爾達傳說','貓狗大戰','碧血狂殺／荒野大鏢客 Red Dead Redemption','邊緣世界 Rim World','洛克人','我想當爺們 I wanna be the guy','艾爾登法環 Elden Ring','異星工廠 Factorio','惡魔城','洞窟物語 Cave Story','隻狼','黑蒂絲 Hades','星海爭霸','洞穴冒險 Spelunky','戰神 god of war','死亡細胞 dead cells','紅色警戒 Red Alerts','Undertale 傳說之下、地域傳說、地下傳說','最後生還者 The Last of Us','蔚藍 Celeste','世紀帝國','去月球 To the Moon','電馭叛客 2077 Cyber Punk 2077','暗黑地牢 Darkest Dungeon','Final Fantasy','植物大戰殭屍 PvZ','地平線 Horizon','星露谷 Stardew Valley','俄羅斯方塊','對馬戰鬼 Ghost of Tsushima','Inside','仙劍奇俠傳','魔塔 Tower of the Sorcerer','死亡擱淺 Death Stranding','上古卷軸V：無界天際'], isConsumed: false, isActivated: true },
            { name: '哲學家語錄', photos: generatePhotoPaths('李長鴻', '哲學家語錄', 30), answers: ['蘇格拉底','尼采','朱熹','孟子','笛卡兒','康德','維根斯坦','亞里斯多德','王陽明','柏拉圖','伊比鳩魯','莊子','孔子','海德格','叔本華','傅柯','萊布尼茨','休姆','阿奎那','嵇康','荀子','哈伯瑪斯','奧古斯丁','羅素','黑格爾','郭象','韓非子','史賓諾沙','王弼','塞內卡'],          isConsumed: false, isActivated: true },
            { name: '美國卡通', photos: generatePhotoPaths('李長鴻', '美國卡通', 32), answers: ['探險活寶 Adventure Time','天兵公園 Regular Show','阿甘妙世界 The Amazing World of Gumball','史蒂芬宇宙 Steven Universe','少年悍將 Teen Titans','少年悍將 GO！ Teen Titans Go!','降世神通：最後的氣宗 Avatar: The Last Airbender','飛天小女警 The Powerpuff Girls','飛哥與小佛 Phineas and Ferb','麻辣女孩 Kim Possible','海綿寶寶 SpongeBob SquarePants','丹尼幽靈 Danny Phantom','天才小子吉米 The Adventures of Jimmy Neutron','Ben 10','神秘小鎮大冒險小鎮 Gravity Falls','星際寶貝 Lilo & Stitch','辛普森家庭 The Simpsons','蓋酷家庭 Family Guy','美國老爸 American Dad!','南方四賤客 South Park','未來少年 Futurama','忍者龜 TMNT','妙妙犬布麗 Bluey','美國龍：傑克龍 American Dragon: Jake Long','瑞克與莫蒂 Ricky and Morty','愛探險的朵拉 Dora the Explorer','愛酷一族 The Grim Adventures of Billy and Mandy','膽小狗英雄 Courage, the cowardly dog','魔法俏佳人 Winx Club','冒險王奇克','替身計畫','校園嬌娃 Totally Spies'],          isConsumed: false, isActivated: true },
            { name: '希臘神話人物', photos: generatePhotoPaths('李長鴻', '希臘神話人物', 30), answers: ['宙斯（Zeus）','波塞頓（Poseidon）','哈迪斯（Hades）','雅典娜（Athena）','阿波羅（Apollo）','阿提米斯（Artemis）','阿瑞斯（Ares）','愛芙蘿黛蒂（Aphrodite）','赫菲斯托斯（Hephaestus）','荷米斯（Hermes）','赫基里斯（Hercules）','柏修斯（Perseus）','阿基里斯（Achilles）','奧德修斯（Odysseus）','傑生（Jason）','忒修斯（Theseus）','阿塔蘭塔／阿塔蘭忒（Atalanta）','奧菲斯（Orpheus）','美杜莎（Medusa）','奇美拉（Chimera）','九頭蛇許德拉（Hydra）','斯芬克斯（Sphinx）','奇戎（Chiron）','塞蓮（Sirens）','哈比（鳥身女妖）（Harpies）','赫拉（Hera）','狄蜜特（Demeter）','戴奧尼修斯（Dionysus）','艾若斯（Eros）','黑卡蒂（Hecate）'],          isConsumed: false, isActivated: false }
        ]
    },
    {
        name: '戴笠',
        themes: [
            { name: '世界知名自然景觀', photos: generatePhotoPaths('戴笠', '世界知名自然景觀', 40), answers: ['大峽谷（美國）','珠穆朗瑪峰／聖母峰（尼泊爾／中國）','大堡礁（澳洲）','亞馬遜雨林（南美洲）','撒哈拉沙漠（非洲）','尼加拉瀑布（美國／加拿大）','優勝美地國家公園（美國）','冰島藍湖（冰島）','富士山（日本）','黃石國家公園（美國）','羚羊峽谷（美國）','波拉波拉島潟湖（法屬玻里尼西亞）','乞力馬扎羅山（坦尚尼亞）','羅托魯瓦地熱區（紐西蘭）','帕塔哥尼亞（阿根廷／智利）','阿塔卡馬沙漠（智利）','班夫國家公園（加拿大）','羅弗敦群島（挪威）','天使瀑布（委內瑞拉）','死海（以色列／約旦）','羅賓漢灣（澳洲）','維多利亞瀑布（尚比亞／辛巴威）','桂林喀斯特地貌（中國）','張家界國家森林公園（中國）','普利特維采湖群（克羅埃西亞）','多洛米蒂山脈（義大利）','阿爾卑斯山（歐洲多國）','冰川國家公園（美國）','納米布沙漠（納米比亞）','馬達加斯加猴麵包樹大道（馬達加斯加）','烏尤尼鹽湖（玻利維亞）','布萊斯峽谷（美國）','托雷斯德爾潘恩國家公園（智利）','仙本那群島（馬來西亞）','藍山國家公園（澳洲）','赫瓦爾島海岸（克羅埃西亞）','亞速爾群島（葡萄牙）','乞拉湖（冰島）','納帕利海岸（夏威夷）','羅賈姆瀑布（挪威）'], isConsumed: false, isActivated: true },
            { name: '動植物（沒人體的生物）', photos: generatePhotoPaths('戴笠', '動植物（沒人體的生物）', 40), answers: ['狗','貓','向日葵','玫瑰','金魚','鯉魚','鬱金香','薰衣草','倉鼠','兔子','仙人掌','薄荷','鸚鵡','孔雀','百合','迷迭香','蜜蜂','蝴蝶','番茄','馬鈴薯','螞蟻','蒼蠅','胡蘿蔔','玉米','老鼠','捕蠅草','豬籠草','樹懶','斑馬','巨杉','海帶','海牛','水獺','海草','珊瑚藻','鴞','鯨鯊','蘇鐵','鍬形蟲','銀杏'],          isConsumed: false, isActivated: true },
            { name: '宗教神祇', photos: generatePhotoPaths('戴笠', '宗教神祇', 30), answers: ['媽祖','阿努比斯','文殊菩薩','索爾','荷魯斯','阿拉','哪吒','奧丁','芙蕾雅','普賢菩薩','地藏菩薩','大黑天','伊西斯','玄天上帝','洛基','嫦娥','濕婆','杜爾迦','城隍爺','天照大神','象頭神迦尼薩','海姆達爾','文昌帝君','毗濕奴','呂洞賓','鐵拐李','塞特','土地公','惠比壽','關聖帝君'],          isConsumed: false, isActivated: true },
            { name: '文化節慶', photos: generatePhotoPaths('戴笠', '文化節慶', 30), answers: ['農曆新年','泰國潑水節','平溪天燈節','日本盂蘭盆節','日本花見','端午節','墨西哥亡靈節','泰國水燈節','里約嘉年華','西班牙番茄節','印度侯麗／灑紅節','札幌雪祭','（大甲）媽祖遶境','葡萄牙藝術節','韓國燃燈會','青森睡魔祭','西班牙奔牛節','英國Bonfire Night','蒙馬特葡萄收穫節','泰國萬佛節','巴西新年','夏威夷花環節','拉丁美洲聖週','仲夏節','歐洲五朔節','基督教聖體聖血節','西藏跳神節','西班牙法雅節','巴布亞紐幾內亞面具節','美國火人祭'],          isConsumed: false, isActivated: false }
        ]
    },
    {
        name: 'VJ',
        themes: [
            { name: '英雄聯盟電競', photos: generatePhotoPaths('VJ', '英雄聯盟電競', 30), answers: ['Faker 李相赫','Ruler 朴載赫','Chovy 鄭智勳','Knight 卓定','Uzi 簡自豪','Deft 金赫奎','Rookie 宋義進','The Shy 姜承錄','Show Maker 許秀','Canyon 金建富','Mata 趙世衡','Bang 裴俊植','Wolf 李在宛','Ambition 姜燦雄','Doinb 金泰相','Ming 史森明','Meiko 田野','Scout 李汭燦','Peanut 韓旺浩','Karsa 洪浩軒','Sword Art 胡碩傑','Maple 黃熠棠','Fofo 朱駿嵐','Caps (Rasmus Winther)','Jankos (Marcin Jankowski)','Perkz (Luka Perkovic)','Hylissang (Zdravets lliev Galabov)','Double lift (Yiliang Peng)','Bjergsen (soren Bjerg)','Impact 鄭多賢'], isConsumed: false, isActivated: true },
            { name: '電腦遊戲', photos: generatePhotoPaths('VJ', '電腦遊戲', 40), answers: ['空洞騎士 Hollow Knight','英雄聯盟 League of Legends','Overcooked','暗黑破壞神 Diablo III','奇妙人生 Life is Strange','銀河洞穴大冒險 Deep Rock Galactic','人類一敗塗地 Human: Fall Flat','魔物獵人 Monster Hunter: World','文明帝國 Civilization VII','Apex','底特律：變人 Detroit: Become Human','茶杯頭 Cuphead','速速上菜 PlateUp!','仁王 Nioh 2','史丹利的寓言 The Stanley Parable','萌萌小人大亂鬥 Gang Beasts','惡靈勢力 Left 4 Dead 2','大都會：天際 Cities: Skylines','救火者 Firewatch','特戰英豪 Valorant',"柏德之門3 Baldur's Gate 3",'泰拉瑞亞 Terraria','十字軍王者 Crusader Kings III','傳送門 Portal','冰封龐克 Frostpunk',"飢荒 Don't Starve Together",'流亡黯道 Path of Exile','古墓奇兵 Tomb Raider','糖豆人 Fall Guys','模擬市民 The Sims','小小夢魘 Little Nightmares','雙人成行 It Takes Two','Stacklands','幽浮 XCOM','奧里與迷失森林 Ori and the Blind Forest','劫薪日 Payday 2','再來一張','食神的卡組 Sizzle and Stack','太空狼人殺 Among Us','邊緣禁地 Borderlands'],          isConsumed: false, isActivated: true },
            { name: '網路迷因', photos: generatePhotoPaths('VJ', '網路迷因', 30), answers: ['你也是對的','嗯，你說得沒錯','你在大聲什麼啦','豆花','計畫通','鎖鏈的康妮','You shall not pass','This is Sparta','This is fine','我要怎麼在沒工作的情況下獲得經驗？','要打去練舞室打','恰恰','For the better, right?',"他們說你是最好的 I'm told you were the best",'你要不要聽聽看你現在在講什麼','25歲的我','Are you winning son?','Hey Apple','Here comes Johnny','Shut up and take my money','Is this a pigeon',"That's a lot of damage",'You dare use my own spell against me','deez nuts','你們在做什~麼？Watcha doing?','Disaster Girl','Success child','黑人問號','Hide the pain Harnold','Distracted boyfriend'],          isConsumed: false, isActivated: true },
            { name: '西方奇幻小說', photos: generatePhotoPaths('VJ', '西方奇幻小說', 28), answers: ['哈利波特','波西傑克森','法柏哈溫','魔戒','納尼亞傳奇','迷霧之子','颶光典籍','時光之輪','黑塔','弒君者三部曲','冰與火之歌','獵魔士','黑暗元素三部曲','遺產四部曲','皇家騎士','阿提米斯（阿特米斯奇幻歷險）','埃及守護神','天使聖物：骸骨之城','巫師神探','地海傳說','刺客後傳','碟型世界','第一法則','破碎大地','罌粟戰爭','太陽召喚','盜賊紳士拉莫瑞','不死煉金術師'],          isConsumed: false, isActivated: false }
        ]
    },
    {
        name: 'Josh 游沛駿',
        themes: [
            { name: '外國政治人物', photos: generatePhotoPaths('Josh 游沛駿', '外國政治人物', 36), answers: ['朴槿惠','馬克宏（Emmanuel Macron）','小池百合子','普丁（Vladimir Putin）','唐納·川普（Donald Trump）','岸田文雄','史考特·莫里森（Scott Morrison）','魯拉（Luiz Inácio Lula da Silva）','文在寅','里希·蘇納克（Rishi Sunak）','菅義偉','伯尼·桑德斯（Bernie Sanders）','澤倫斯基（Volodymyr Zelenskyy）','薩科齊（Nicolas Sarkozy）','尹錫悅','歐巴馬（Barack Obama）','朔爾茨（Olaf Scholz）','波索納洛（Jair Bolsonaro）','希拉蕊·柯林頓（Hillary Clinton）','賈斯汀·杜魯道（Justin Trudeau）','李在明','南希·裴洛西（Nancy Pelosi）','安倍晉三','戴維·卡麥隆（David Cameron）','莫迪（Narendra Modi）','安東尼·艾班尼斯（Anthony Albanese）','歐朗德（François Hollande）','喬治·布希（George W. Bush）','尼坦雅胡（Benjamin Netanyahu）','鮑里斯·強森（Boris Johnson）','卡瑪拉·賀錦麗（Kamala Harris）','李希·特拉斯（Liz Truss）','梅德韋傑夫（Dmitry Medvedev）','喬·拜登（Joe Biden）','華春瑩','習近平'], isConsumed: false, isActivated: true },
            { name: '台灣城市', photos: generatePhotoPaths('Josh 游沛駿', '台灣城市', 36), answers: ['南投（向山遊客中心）','高雄（85大樓）','宜蘭（蘭陽博物館）','臺中（富邦天空樹）','臺南（臺南市立美術館2館）','桃園（桃園市立美術館）','高雄（衛武營國家藝術文化中心）','臺中（東海大學路思義教堂）','臺北（臺北101）','彰化（扇形車庫）','高雄（高雄流行音樂中心）','嘉義（故宮南院）','臺北（富富話合）','臺中（綠美圖）','新竹（新竹市立動物園）','臺南（鹽埕圖書館）','臺北（陶珠隱園）','花蓮（貨櫃屋星巴克）','臺中（國家歌劇院）','宜蘭（羅東文化工場）','高雄（中鋼總部大樓）','嘉義（嘉義市立美術館）','臺北（砳建築）','新北（淡水雲門劇場）','臺中（亞洲大學現代美術館）','臺南（臺南市立圖書館總館）','桃園（桃園機場第三航廈）','臺南（奇美博物館）','新北（新北市立圖書館總館）','高雄（高雄展覽館）','臺北（臺北表演藝術中心）','彰化（溪州糖廠鐵橋）','南投（九族文化村纜車站）','新竹（清華大學旺宏館）','臺南（臺南市立美術館1館）','臺中（臺中市立圖書館總館）'],          isConsumed: false, isActivated: true },
            { name: '好萊塢演員', photos: generatePhotoPaths('Josh 游沛駿', '好萊塢演員', 40), answers:   [
    "Tom Hanks　湯姆·漢克斯",
    "Meryl Streep　梅莉·史翠普",
    "Leonardo DiCaprio　李奧納多·狄卡皮歐",
    "Cate Blanchett　凱特·布蘭琪",
    "Brad Pitt　布萊德·彼特",
    "Natalie Portman　娜塔莉·波曼",
    "Denzel Washington　丹佐·華盛頓",
    "Scarlett Johansson　史嘉蕾·喬韓森",
    "Robert Downey Jr.　小勞勃·道尼",
    "Jennifer Lawrence　珍妮佛·勞倫斯",
    "Morgan Freeman　摩根·費里曼",
    "Charlize Theron　莎莉·賽隆",
    "Johnny Depp　強尼·戴普",
    "Viola Davis　薇拉·戴維斯",
    "Will Smith　威爾·史密斯",
    "Emma Stone　艾瑪·史東",
    "Joaquin Phoenix　瓦昆·菲尼克斯",
    "Sandra Bullock　珊卓·布拉克",
    "Chris Evans　克里斯·伊凡",
    "Margot Robbie　瑪格·羅比",
    "Ryan Reynolds　萊恩·雷諾斯",
    "Zendaya　珍達亞",
    "Dwayne Johnson　道恩·強森",
    "Anne Hathaway　安·海瑟薇",
    "Benedict Cumberbatch　班奈狄克·康柏拜區",
    "Lupita Nyong'o　露琵塔·尼詠歐",
    "Matt Damon　麥特·戴蒙",
    "Halle Berry　荷莉·貝瑞",
    "Tom Holland　湯姆·霍蘭德",
    "Reese Witherspoon　瑞絲·薇斯朋",
    "Jake Gyllenhaal　傑克·葛倫霍",
    "Florence Pugh　佛蘿倫斯·普伊",
    "Pedro Pascal　佩卓·帕斯卡",
    "Sydney Sweeney　雪梨·史威尼",
    "Timothée Chalamet　提摩西·夏勒梅",
    "Anya Taylor-Joy　安雅·泰勒-喬伊",
    "Austin Butler　奧斯汀·巴特勒",
    "Ana de Armas　安娜·德·阿瑪斯",
    "Glen Powell　葛倫·鮑威爾",
    "Olivia Rodrigo　奧莉薇亞·羅德里戈"
  ],          isConsumed: false, isActivated: true },
            { name: '臺灣店家logo', photos: generatePhotoPaths('Josh 游沛駿', '臺灣店家logo', 37), answers: ['全聯','家樂福','7-11','全家','誠品','太平洋SOGO','黑松','味全','義美','光泉','迷客夏','COCO','清心福全','八方雲集','純喫茶','大潤發','康是美','寶雅','小林眼鏡','燦坤','全國電子','特力屋','愛買','World Gym','健身工廠','摩斯漢堡','頂呱呱','爭鮮','石二鍋','麥味登','路易莎','Cama咖啡','伯朗咖啡','再睡五分鐘','Comebuy','21世紀風味烤雞','美廉社'],          isConsumed: false, isActivated: false }
        ]
    },
    {
        name: '貓南北',
        themes: [
            { name: '臺灣常見外來種', photos: generatePhotoPaths('貓南北', '臺灣常見外來種', 38), answers: ['小印度貓鼬','荒地麻蜥（外來族群）','埃及聖䴉','白腰文鳥（引入族群）','琵琶鼠魚','吳郭魚','紅火蟻','小火蟻','小花蔓澤蘭','銀合歡','綠鬣蜥','紅耳龜','斑文鳥（引入族群）','白頰椋鳥','美洲牛蛙','大肚魚','白尾捲葉象鼻蟲（擴散種）','椰子犀角金龜','大花咸豐草','互花米草','緬甸蟒','球蟒（逸出個體）','家八哥','爪哇八哥','孔雀魚（野化族群）','錦鯉（逸出族群）','布袋蓮','蘆葦（擴張族群）','食蟹獴（待替換）','家兔（野化族群）','鸚鵡（多種逸出）','珠頸斑鳩（部分外來族群）','鱷龜','彩龜','番石榴果實蠅','貓跳蚤','馬纓丹','美洲含羞草'], isConsumed: false, isActivated: true },
            { name: '臺灣原生動植物物種', photos: generatePhotoPaths('貓南北', '臺灣原生動植物物種', 38), answers: ['臺灣黑熊','臺灣獼猴','臺灣油杉','臺灣扁柏','石虎','臺灣穿山甲','紅檜','臺灣杉','梅花鹿','臺灣水鹿','昆欄樹','臺灣山毛櫸','臺灣藍鵲','帝雉','臺灣二葉松','臺灣五葉松','藍腹鷴','臺灣山鷓鴣','玉山圓柏','臺灣魚鱗雲杉','臺灣長鬃山羊','臺灣野豬','臺灣百合','臺灣一葉蘭','臺灣飛鼠','臺灣草蜥','臺灣蝴蝶蘭','臺灣金線蓮','雲豹','臺灣爬岩鰍','玉山薄雪草','臺灣高山杜鵑','臺灣朱雀','臺灣陸龜','臺灣馬醉木','臺灣澤蘭','臺灣胡桃','臺灣野薔薇'],          isConsumed: false, isActivated: true },
            { name: '臺灣行道樹&園藝植物', photos: generatePhotoPaths('貓南北', '臺灣行道樹&園藝植物', 36), answers: ['榕樹','虎尾蘭','茄苳','唐竹','阿勃勒','班葉鵝掌藤','臺灣欒樹','黑松','雪茄花','樟樹','琴葉榕','重陽木','蒲葵','苦楝','天堂鳥','九芎','日本女貞','臺灣櫸（雞油）','龜背芋','白千層','厚葉石斑木','山櫻花（緋寒櫻）','百合竹','楓香','五爪木','水黃皮','蘭嶼肉桂','光臘樹','臺北海桐','黃槿','印度橡膠樹','青楓','竹柏','朴樹','白水木','瓊崖海棠'],          isConsumed: false, isActivated: true },
            { name: '蔬菜水果', photos: generatePhotoPaths('貓南北', '蔬菜水果', 40), answers: ['蘋果','香蕉','西瓜','芒果','鳳梨','木瓜','蓮霧','芭樂','葡萄','草莓','荔枝','龍眼','楊桃','釋迦','百香果','火龍果','柳橙','柚子','檸檬','番茄','高麗菜','花椰菜','空心菜','地瓜葉','菠菜','茄子','苦瓜','絲瓜','冬瓜','南瓜','小黃瓜','玉米','紅蘿蔔','白蘿蔔','馬鈴薯','地瓜','芋頭','蘆筍','韭菜','山藥'],          isConsumed: false, isActivated: false }
        ]
    },
    {
        name: '何柏穎',
        themes: [
            { name: '國家名稱', photos: generatePhotoPaths('何柏穎', '國家名稱', 48), answers: ['答案1', '答案2'], isConsumed: false, isActivated: true },
            { name: '台灣鄉鎮名稱', photos: generatePhotoPaths('何柏穎', '台灣鄉鎮名稱', 30), answers: ['中正區','大安區','板橋區','淡水區','桃園區','中壢區','西屯區','后里區','中西區','安平區','岡山區','鹽埕區','仁愛區','中正區','苗栗市','頭份市','彰化市','員林市','南投市','埔里鎮','斗六市','太保市','恆春鎮','羅東鎮','花蓮市','臺東市','馬公市','湖西鄉','南竿鄉','北竿鄉'],          isConsumed: false, isActivated: true },
            { name: '電機/電子元件', photos: generatePhotoPaths('何柏穎', '電機/電子元件', 34), answers: ['電阻器','電位器','陶瓷電容','電解電容','鉭質電容','電感器','變壓器','水晶振盪器','整流二極體','稽納二極體','蕭特基二極體','發光二極體','光電二極體','變容二極體','NPN BJT','PNP BJT','N通道 MOSFET','P通道 MOSFET','JEFT','IGBT','運算放大器','比較器','555計時器','線性穩壓器','邏輯閘IC','移位暫存器','多工器','微控制器','光耦合器','七段顯示器','保險絲','TVS 二極體','繼電器','PTC 復歸保險絲'],          isConsumed: false, isActivated: true },
            { name: '體育/運動項目', photos: generatePhotoPaths('何柏穎', '體育/運動項目', 48), answers: ['足球','籃球','棒球','網球','排球','桌球','羽毛球','游泳','跳水','衝浪','滑板','滑雪','單板滑雪','溜冰（花式／競速）','體操（地板）','韻律體操','跨欄','標槍','鉛球','跳高','撐竿跳','舉重','摔角','柔道','拳擊','劍道','擊劍','射箭','射擊','馬術','賽車（F1）','自行車（公路賽）','越野滑輪','划船','帆船','衝浪風帆','攀岩','跳傘'],          isConsumed: false, isActivated: false }
        ]
    }
]

