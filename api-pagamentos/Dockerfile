# 1. Escolha a imagem base (exemplo com Node, troque para python:3.9 se necessário)
FROM node:18-alpine

# 2. Define o diretório de trabalho dentro do container
WORKDIR /app

# 3. Copia os arquivos de dependências
COPY package*.json ./

# 4. Instala as dependências
RUN npm install

# 5. Copia o restante do código da API
COPY . .

# 6. Porta que a API escuta
EXPOSE 3000

# 7. Comando para iniciar
CMD ["npm", "start"]

