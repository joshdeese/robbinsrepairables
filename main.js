import { parse } from 'node-html-parser';
import https from 'https';
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

  https.get('https://robbinsrepairables.com/vehicles.php', res => {
    let data = [];
    const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';

    res.on('data', chunk => {
      data.push(chunk);
    });

    res.on('end', () => {
      let body = parse(Buffer.concat(data).toString());
      let nodes = body.querySelectorAll('h3 a');
      let cars = nodes.map(a => {
        let myNode = a.parentNode.parentNode.parentNode;
        let myImg = myNode.querySelector('img');
        myImg.setAttribute('src', myImg.getAttribute('data-original'));
        let hrefs = myNode.querySelectorAll('a');

        for(var i=0; i<hrefs.length; i++){
          hrefs[i].setAttribute('href', 'https://robbinsrepairables.com' + hrefs[i].getAttribute('href'));
        }

        return {
          title: a.innerHTML,
          link: a.getAttribute('href'),
          vid: a.getAttribute('href').split('=')[1],
          block: myNode.outerHTML
        }
      });
      let new_cars = cars.filter(a => { return prev_ids.indexOf(a.vid) == -1 });
      const transport_opt = {
        auth: {
          domain: process.env.MAILGUN_DOMAIN,
          api_key: process.env.MAILGUN_KEY
        }
      }
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
        transporter.sendMail(mailOpts, (err, response) => {
          if(err){
            console.log('error sending email', err);
          } else {
            console.log('message sent');
          }
        });
      } else {
        const mailOpts = {
          from: process.env.MAIL_FROM,
          to: process.env.MAIL_TO,
          subject: "New Cars at Robbin's Repairables",
          text: "No new cars at this time"
        };
        console.log('no new cars at this time');
        transporter.sendMail(mailOpts, (err, response) => {
          if(err){
            console.log('error sending email', err);
          } else {
            console.log('no new cars message sent');
          }
        });
      }

      fs.writeFile('./data/data.json', JSON.stringify(cars), function(){});
    });
  }).on('error', err => {
    console.log('Error: ', err.message);
  });
}

const job = new CronJob(
  '0 0 8-20 * * *',
  //'*/10 * * * * *',
  main,
  null,
  true,
  'America/New_York'
);
