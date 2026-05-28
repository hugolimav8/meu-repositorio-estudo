const express = require('express');
const app = express();

// Rota raiz atual
app.get('/', (req, res) => res.send('API de Pagamentos Rodando, testando o RollBack!'));

// ADICIONE ESTA LINHA:
app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(3000, () => console.log('Servidor na porta 3000'));
