import puppeteer from 'puppeteer';
import fs from 'fs/promises';

var file_data = await fs.readFile('data.json', { encoding: 'utf-8' })
let prev_data = [];
try {
  prev_data = JSON.parse(file_data);
} catch(err){
  console.error('data file does not contain proper json');
}

const prev_ids = prev_data.map(a => { return a.vid } );

const browser = await puppeteer.launch();
const page = await browser.newPage();
page.setDefaultNavigationTimeout(0);
const response = await page.goto('https://robbinsrepairables.com/vehicles.php');

const cars = await page.$$eval('h3 a', (nodes) => {
  return nodes.map(a => {
    return {
      title: a.innerHTML,
      link: a.href,
      vid: a.href.split('=')[1]
    }
  });
});

console.log('new cars: ', cars.filter(a => { return prev_ids.indexOf(a.vid) == -1 }));

await fs.writeFile('./data.json', JSON.stringify(cars), function(){});

await browser.close();
