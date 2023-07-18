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
          a{
            text-decoration: none;
            color: black;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
        
          form {
            max-width: 1000px;
            min-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 5px;
            background-color: #f5f5f5;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
          }
        
          label {
            display: block;
            margin-bottom: 5px;
          }
        
          .form-column {
            flex-basis: 45%;
            margin-bottom: 10px;
          }
        
          select,
          input[type="text"],
          input[type="number"],
          input[type="submit"],
          input[type="checkbox"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
            margin-bottom: 10px;
          }
        
          input[type="submit"] {
            background-color: #4caf50;
            color: #fff;
            cursor: pointer;
          }
        
          input[type="checkbox"] {
            display: inline;
            width: auto;
            margin-right: 5px;
          }
        </style>
      </head>
      <body>
      <form action="search_results.html" method="GET">
      <div class="form-column">
      <label for="object-type">Type of Object:</label>
      <select name="object-type" id="object-type">
        <option value="house">House</option>
        <option value="apartment">Apartment</option>
        <option value="office">Office</option>
        <!-- Add more options as needed -->
      </select>
      <br>
    
      <label for="building-type">Type of Building:</label>
      <select name="building-type" id="building-type">
        <option value="residential">Residential</option>
        <option value="commercial">Commercial</option>
        <!-- Add more options as needed -->
      </select>
      <br>
    
      <label for="announcement-type">Type of Announcement:</label>
      <select name="announcement-type" id="announcement-type">
        <option value="sale">Sale</option>
        <option value="rent">Rent</option>
        <!-- Add more options as needed -->
      </select>
      <br>
    
      <label for="vendor-type">Vendor Type:</label>
      <select name="vendor-type" id="vendor-type">
        <option value="individual">Individual</option>
        <option value="agency">Agency</option>
        <!-- Add more options as needed -->
      </select>
      <br>
    
      <label for="city">City:</label>
      <input type="text" name="city" id="city">
      <br>
    
      <label for="district">District:</label>
      <input type="text" name="district" id="district">
      <br>
    
      <label for="metro">Metro:</label>
      <input type="text" name="metro" id="metro">
      <br>
    
      <label for="cave">The Cave:</label>
      <input type="text" name="cave" id="cave">
      <br>
    
      <label for="bookmark">Bookmark:</label>
      <input type="text" name="bookmark" id="bookmark">
      <br>
    
      <label for="keywords">By Words:</label>
      <input type="text" name="keywords" id="keywords">
      <br>
      </div>
      <div class="form-column">    
      <label for="document">Document:</label>
      <input type="text" name="document" id="document">
      <br>
    
      <label for="credit-condition">Credit Condition:</label>
      <input type="text" name="credit-condition" id="credit-condition">
      <br>
    
      <label for="room-number">Room Number:</label>
      <input type="number" name="room-number" id="room-number">
      <br>
    
      <label for="editing">Editing:</label>
      <input type="text" name="editing" id="editing">
      <br>
    
      <label for="floor">Floor:</label>
      <input type="number" name="floor" id="floor">
      <br>
    
      <input type="checkbox" name="not-last-floor" id="not-last-floor">
      <label for="not-last-floor">Not the Last Floor</label>
      <br>
    
      <label for="building-floor">Building Floor Number:</label>
      <input type="number" name="building-floor" id="building-floor">
      <br>
    
      <label for="price">Price:</label>
      <input type="number" name="price" id="price">
      <br>
    
      <label for="field">Field (m2):</label>
      <input type="number" name="field" id="field">
      <br>
      </div>    
      <input type="submit" value="Search">
    </form>
      
        <div class="image-container">
        `;

  data.forEach(property => {
    const { link, imageURL, price, sellingRent, documents, city, regionPlace, floor, room, source } = property;
    html += `
      <div>
        <a href="${link}" target="_blank"><img src="${imageURL}" data-src="${imageURL}"/><br>
        <span>Price: ${price}</span><br>
        <span>Selling/Rent: ${sellingRent}</span><br>
        <span>Documents: ${documents}</span><br>
        <span>City: ${city}</span><br>
        <span>Region/Place: ${regionPlace}</span><br>
        <span>Floor: ${floor}</span><br>
        <span>Room: ${room}</span><br>
        <span>Source: ${source}</span></a>
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
  const websites = [
    { url: 'https://bina.az/', source: 'Bina.az' },
    { url: 'https://kub.az/', source: 'Kub.az' },
    { url: 'https://arenda.az/', source: 'Arenda.az' },
    { url: 'https://yeniemlak.az/', source: 'Yeniemlak.az' }
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
  };

  try {
    const results = [];

    for (const website of websites) {
      console.log(website.url)
      const response = await axios.get(website.url, { headers });

      if (response.status === 200) {
        const $ = cheerio.load(response.data);
        
        let propertyItems;

        if (website.source === 'Bina.az') {
          propertyItems = $('.items-i.vipped');
        }  else if (website.source === 'Yeniemlak.az') {
          propertyItems = $('.ads');
        }else if (website.source === 'Kub.az') {
          propertyItems = $('.item');
        } else if (website.source === 'Arenda.az') {
          propertyItems = $('.new_elan_box');
        }

        propertyItems.each((index, element) => {
          let link, imageURL, price, sellingRent, documents, city, regionPlace, floor, room;

          if (website.source === 'Bina.az') {
            
            const linkElement = $(element).find('.item_link');
            link = 'https://bina.az/' + linkElement.attr('href');
            const anchorTag = linkElement.prop('outerHTML'); // Get the full anchor tag HTML

            const imageElement = $(element).find('.slider_image img');
            imageURL = imageElement.attr('data-src');

            const priceElement = $(element).find('.price-val');
            price = priceElement.text().trim();

            const locationElement = $(element).find('.location');
            regionPlace = locationElement.text().trim();
            city = locationElement.text().trim();
            //const locationParts = locationText.split(',');

            //city = locationParts[0].trim();
            //regionPlace = locationParts[1].trim();

            sellingRent = 'Not Found'; // Not available on Bina.az
            documents = 'Not Found'; // Not available on Bina.az
            floor = 'Not Found'; // Not available on Bina.az
            room = 'Not Found'; // Not available on Bina.az
          } else if (website.source === 'Kub.az') {
            //console.log('Im at 2');
            const linkElement = $(element).find('.item-picture a');
            link ='https://kub.az/'+linkElement.attr('href');

            const imageElement = $(element).find('.item-picture img');
            imageURL = 'https://kub.az/'+imageElement.attr('src');

            const priceElement = $(element).find('.item-price .price-amount');
            price = priceElement.text().trim();

            const nameElement = $(element).find('.item-category b:first-child');
            const name = nameElement.text().trim();

            const createdElement = $(element).find('.item-date');
            const created = createdElement.text().trim();

            const locationElements = $(element).find('.details .text-nowrap b');
            city = locationElements.eq(0).text().trim();
            regionPlace = locationElements.eq(1).text().trim();

            sellingRent = 'Not Found'; // Not available in the provided HTML structure
            documents = 'Not Found'; // Not available in the provided HTML structure
            floor = 'Not Found'; // Not available in the provided HTML structure
            room = 'Not Found'; // Not available in the provided HTML structure
        
            //console.log(link, imageURL, price, city, regionPlace, name, created);
        } else if (website.source === 'Yeniemlak.az') {
           
              const linkElement = $(element).find('a[href^="/elan/"]');
              const link = 'https://yeniemlak.az' + linkElement.attr('href');
          
              const imageElement = $(element).find('img');
              imageURL = 'https://yeniemlak.az/' + imageElement.attr('src');
          
              const priceElement = $(element).find('.price');
              price = priceElement.text().trim();
          
              const locationElement = $(element).find('.bottom b').last();
              //const locationText = locationElement.text().trim();
              //const locationParts = locationText.split(',');
          
              city = 'Not Found'//locationElement
              regionPlace = 'Not Found'//locationElement
          
              room = 'Not Found'; // Not available on Yeniemlak.az
              floor = 'Not Found'; // Not available on Yeniemlak.az
              sellingRent = price; // Extract selling/rent info from adjacent element
              documents = 'Not Found'; // Not available on Yeniemlak.az
          
              //console.log(link, imageURL, price, city, regionPlace);
          }else if (website.source === 'Arenda.az') {
            
            const linkElement = $(element).find('a');
            link = linkElement.attr('href');
        
            const imageBoxElement = $(element).find('.full.elan_img_box');
            
            const imageElement = imageBoxElement.find('img');
           
            imageURL = imageElement.attr('data-src');
            //console.log(imageURL)
        
            const priceElement = $(element).find('.elan_price');
            price = priceElement.text().trim();
            
            const locationElement = $(element).find('.elan_unvan');
            const locationText = locationElement.text().trim();
            const locationParts = locationText.split(',');
        
            city = 'Not Found'//locationParts[0].trim();
            regionPlace = 'Not Found'//locationParts[1].trim();
        
            room = 'Not Found'; // Not available on Arenda.az
            floor = 'Not Found'; // Not available on Arenda.az
            sellingRent = price; // Not available on Arenda.az
            documents = 'Not Found'; // Not available on Arenda.az
        
            
        }
         
        
          if(price!=''){
            results.push({
            link,
            imageURL,
            price,
            sellingRent,
            documents,
            city,
            regionPlace,
            floor,
            room,
            source: website.source
          });}
        });
      } else {
        console.log(`Failed to retrieve data from ${website.url}. Status code: ${response.status}`);
      }
    }

    //console.log(results);
    const htmlContent = generateHTML(results);
    saveHTML(htmlContent);

    console.log('Scraped data saved to HTML file.');
    //res.send('Scraping complete.'); // Stop execution and send response
  } catch (error) {
    console.log(`An error occurred: ${error}`);
    //res.status(500).send('An error occurred during scraping.'); // Stop execution and send error response
  }
}




cron.schedule('*/5 * * * *',   () => {
  console.log('Running scraper...');
  scrapeSite().catch(error => {
    console.log(`An error occurred in the scheduled task: ${error}`);
  });
}); 

module.exports = { scrapeSite };
