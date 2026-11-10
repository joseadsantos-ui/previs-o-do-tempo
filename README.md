# Consulta do Clima

Página web que consulta o clima de uma cidade em tempo real usando a API
pública **Open-Meteo**. Atividade de Consumo de API REST do curso Técnico em
Desenvolvimento de Sistemas (SENAI Lages).

## API escolhida

**Open-Meteo** — gratuita, sem cadastro e sem chave de acesso.

| Item da documentação | Valor usado |
| --- | --- |
| Endpoint de geocodificação | `https://geocoding-api.open-meteo.com/v1/search` |
| Endpoint de clima | `https://api.open-meteo.com/v1/forecast` |
| Parâmetro da cidade | `name` (só na geocodificação) |
| API Key | não é necessária |
| Unidade de temperatura | Celsius (padrão) |
| Documentação | https://open-meteo.com/en/docs |

A Open-Meteo funciona em duas etapas: a primeira requisição transforma o nome
da cidade em latitude e longitude, e a segunda usa essas coordenadas para
buscar o clima. O endpoint de clima não aceita nome de cidade.

## Como executar

Baixe os três arquivos (`index.html`, `style.css`, `script.js`), mantenha-os na
mesma pasta e abra o `index.html` no navegador. Não há dependências nem chave
de API para configurar.

## Dados exibidos

Cidade, condição climática, temperatura, sensação térmica, umidade e vento —
todos vindos da API. Nenhum valor de clima está fixo no HTML.

## Tratamento de erros

| Situação | O que acontece |
| --- | --- |
| Campo vazio | Mensagem "Digite o nome de uma cidade." e o foco volta para o campo. |
| Cidade inexistente | A geocodificação responde sem a lista `results`; a página mostra uma mensagem específica. |
| Falha de rede ou da API | O `catch` exibe a mensagem de falha de conexão. |

## Melhorias individuais

1. **Tradução do `weather_code`.** A Open-Meteo devolve a condição climática
   como um número no padrão WMO. Criei uma tabela que converte esse código em
   texto e ícone, porque senão a tela mostraria só "3" no lugar de "Nublado".
2. **Confirmação do local encontrado.** Além do nome, a página mostra o estado
   e o país retornados pela geocodificação, para deixar claro qual cidade foi
   usada quando existe mais de uma com o mesmo nome.
3. **Histórico das últimas cinco buscas.** As cidades pesquisadas ficam salvas
   no navegador com `localStorage` e viram botões que repetem a consulta.
4. **Estado de carregamento e erros separados.** O botão fica desabilitado e
   muda de texto durante a requisição, e a mensagem de "cidade não encontrada"
   é diferente da mensagem de falha de conexão.

Duas decisões de código que valem comentar: a montagem do resultado usa
`createElement` e `textContent` em vez de `innerHTML` com o texto digitado, e
o nome exibido é o que a API devolve, não o que o usuário digitou.
5. **Ilustrações em SVG e fundo que muda com o tempo.** Cada `weather_code`
   vira uma categoria (limpo, parcial, nublado, nevoeiro, chuva, neve,
   trovoada), que define o desenho e as cores do fundo. O parâmetro `is_day`
   da API troca o sol pela lua e escurece o fundo à noite. Os desenhos são
   SVG escritos no próprio JavaScript, então não dependem de imagens externas
   nem de direitos autorais.
6. **Cenário animado no fundo.** Sol com brilho, nuvens passando, chuva, neve,
   pedras de gelo e pingentes de gelo no topo, tudo em CSS puro (sem imagem e
   sem JavaScript). As animações são desligadas para quem ativa "reduzir
   movimento" no sistema (`prefers-reduced-motion`).
