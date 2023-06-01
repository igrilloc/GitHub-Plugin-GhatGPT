import express, { json } from 'express';
import cors from 'cors';

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';



const PORT = process.env.PORT ?? 3000
const app = express();

app.use(cors({ origin: [`https://localhost:${PORT}`, 'https://chat.openai.com']}));
app.use(json());


app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});


// 1. Preparar los endpoints para servir la información 
// que necesita el Plugin de ChatGPT
app.get('/openapi.yaml', async (req, res, next) => {

    try {
        
        const filePath = path.join(process.cwd(), 'openapi.yaml');
        const yamlData = await fs.readFile(filePath, 'utf8');

        res.setHeader('Content-Type', 'text/yaml');
        res.send(yamlData);

    }   catch(error) {

            console.log(`Error: ${error.message}`);
            res.status(500).send({ error: 'Unable to fetch openai.yaml manifest' });

    }

});

app.get('/.well-known/ai-plugin.json', (req, res) => {
    res.sendFile(path.join(process.cwd(), '.well-known/ai-plugin.json'))
});

app.get('/logo.png', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'logo.png'))
});


// 2. Los endpoints de la API para que funcione
// el Plugin de ChatGPT con Github
app.get('/search', async (req, res) => {

    const apiURL = `https://api.github.com/search/repositories?q=${q}`
    
    const apiResponse = await fetch(apiURL, {
        headers: {
            'User-Agent': 'GhatGPT Plugin v1.0.0 - @igrilloc',
            'Accept': 'application/vnd.github.v3+json'
        }
    });


    if(!apiResponse.status.ok) {
        return res.sendStatus(apiResponse.status);
    }


    const json = await apiResponse.json();

    const repos = json.items.map((item) => (
        {
            name: item.name,
            description: item.description,
            stars: item.stargazers_count,
            url: item.html_url
        }
    ));

    return res.json({ repos });

});



// 3. Iniciar el servidor
app.listen(PORT, () => {
    console.log('ChatGPT Plugin is listening on port', PORT);
});