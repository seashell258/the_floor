FROM node:20-alpine
# 2. 全域安裝 Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code
# 1. 安裝基礎工具
RUN apk add --no-cache git bash openssh-client
# 1. 安裝基礎工具（加入 python3 並建立 python 連結）跑 hook 腳本用
RUN apk add --no-cache git bash openssh-client python3 && ln -sf python3 /usr/bin/python

# 3. 建立非 root seashell，直接歸類在內建的 node 群組
RUN adduser -D -G node seashell

# 4. 過戶給 seashell 使用者與 node 群組
RUN mkdir -p /home/seashell/.claude && chown -R seashell:node /home/seashell

# 沒有這個的話，claude code裡面使用 @來試著選檔案的時候，會看不到你鍵盤 hover 的檔案是哪一個 (他提示的顏色會顯示不出來)
ENV TERM=xterm-256color
ENV COLORTERM=truecolor

WORKDIR /app
CMD ["bash"]