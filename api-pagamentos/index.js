   const express = require('express');
   const app = express();
   app.get('/', (req, res) => res.send('API de Pagamentos Rodando!'));
   app.listen(3000, () => console.log('Servidor na porta 3000'));
