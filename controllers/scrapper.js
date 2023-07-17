const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const fs = require('fs');

function generateHTML(data) {
  let html = `
    <html>
      <head>
        <style>
          .image-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
          }

          .image-container img {
            margin: 5px;
          }
        </style>
      </head>
      <body>
        <div class="image-container">`;

  data.forEach(property => {
    const { link, imageURL, price, location } = property;
    html += `
      <div>
        <a href="${link}" target="_blank"><img src="${imageURL}" /></a><br>
        <span>Price: ${price}</span><br>
        <span>Location: ${location}</span>
      </div>
    `;
  });

  html += `
        </div>
      </body>
    </html>`;

  return html;
}

function saveHTML(content) {
  fs.readFile('views/index.html', 'utf8', (err, data) => {
    if (err) {
      console.log(`Failed to read HTML file: ${err}`);
      return;
    }
    
    const combinedContent = content + data;
    
    fs.writeFile('views/index.html', combinedContent, (err) => {
      if (err) {
        console.log(`Failed to save HTML file: ${err}`);
      } else {
        console.log('HTML file saved successfully.');
      }
    });
  });
}

const scrapeSite = async (req, res) => {
  const url = 'https://bina.az/';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
  };

  try {
    const response = await axios.get(url, { headers });
    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      const propertyItems = $('.items-i.vipped');
      const results = [];

      propertyItems.each((index, element) => {
        const linkElement = $(element).find('.item_link');
        const link = 'https://bina.az/'+linkElement.attr('href');
        const anchorTag = linkElement.prop('outerHTML'); // Get the full anchor tag HTML
        
        const imageElement = $(element).find('.slider_image img');
        const imageURL = imageElement.attr('data-src');
        
        const priceElement = $(element).find('.price-val');
        const price = priceElement.text().trim();
        
        const locationElement = $(element).find('.location');
        const location = locationElement.text().trim();
        
        results.push({
          link,
          imageURL,
          price,
          location,
        });
      });
      console.log(results)
      const htmlContent = generateHTML(results);
      saveHTML(htmlContent);

      console.log('Scraped data saved to HTML file.');
      //return res.send('Scraping complete.'); // Stop execution and send response
    } else {
      console.log(`Failed to retrieve data from ${url}. Status code: ${response.status}`);
      return res.status(500).send('Failed to retrieve data.'); // Stop execution and send error response
    }
  } catch (error) {
    console.log(`An error occurred: ${error}`);
    return res.status(500).send('An error occurred during scraping.'); // Stop execution and send error response
  }
}



cron.schedule('*/5 * * * *',   () => {
  console.log('Running scraper...');
  scrapeSite().catch(error => {
    console.log(`An error occurred in the scheduled task: ${error}`);
  });
}); 

module.exports = { scrapeSite };
