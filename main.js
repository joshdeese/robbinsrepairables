import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import nodemailer from 'nodemailer';
import mailgunTransport from 'nodemailer-mailgun-transport';
import dotenv from 'dotenv/config';
import { CronJob } from 'cron';

async function main() {
  var file_data = await fs.readFile('./data/data.json', { encoding: 'utf-8' })
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
      let myNode = a.parentNode.parentNode.parentNode;
      let myImg = myNode.querySelector('img');
      myImg.setAttribute('src', myImg.getAttribute('data-original'));
      let hrefs = myNode.querySelectorAll('a');

      for(var i=0; i<hrefs.length; i++){
        hrefs[i].setAttribute('href', 'https://robbinsrepairables.com' + hrefs[i].getAttribute('href'));
      }

      return {
        title: a.innerHTML,
        link: a.href,
        vid: a.href.split('=')[1],
        block: myNode.outerHTML
      }
    });
  });

  let new_cars = cars.filter(a => { return prev_ids.indexOf(a.vid) == -1 });
  const transport_opt = {
    auth: {
      domain: process.env.MAILGUN_DOMAIN,
      api_key: process.env.MAILGUN_KEY
    }
  };
  var transport = mailgunTransport(transport_opt); 
  var transporter = nodemailer.createTransport(transport);

  if(new_cars.length > 0){
    let html = "";
    for(var i=0; i<new_cars.length; i++){
      html += '<hr>' + new_cars[i].block;
    }

    const mailOpts = {
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_TO,
      subject: "New Cars at Robbin's Repairables",
      html: html
    };
    //console.log('mailOpts: ', mailOpts);
    transporter.sendMail(mailOpts, (err, response) => {
      if(err){
        console.log('error sending email', err);
      } else {
        console.log('message sent');
      }
    });
    //console.log('new cars: ', new_cars );
  } else {
    const mailOpts = {
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_TO,
      subject: "New Cars at Robbin's Repairables",
      text: "No new cars at this time"
    };
    console.log('no new cars at this time');
  }

  await fs.writeFile('./data/data.json', JSON.stringify(cars), function(){});

  await browser.close();
}

const job = new CronJob(
  //'0 0 8-20 * * *',
  '*/10 * * * * *',
  main,
  null,
  true,
  'America/New_York'
);
