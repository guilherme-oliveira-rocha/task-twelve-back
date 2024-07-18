const informationModel = require("../model/informationModel")
const passwordGmail = process.env.PASSWORD_GMAIL

module.exports.searchInformations = async (req, res) => {

  const searchName = req.body.name

  const info = await informationModel.find({'name' : new RegExp(searchName, 'i')})
  res.send(info)
}

module.exports.getInformations = async (req, res) => {
  try {
    await this.getNewEmailsReceived();
    const info = await informationModel.find();
    res.send(info);
  } catch (error) {
    res.status(500).send({ error: error.message, msg: "Something went wrong!" });
  }
};

module.exports.getNewEmailsReceived = () => {
  return new Promise((resolve, reject) => {
    const Imap = require('node-imap');
    const { simpleParser } = require('mailparser');
    const cheerio = require('cheerio');
    
    const imap = new Imap({
      user: 'guilherme.dev12@gmail.com',
      password: passwordGmail,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
    });
    
    let emailData = [];
    
    function openInbox(cb) {
      imap.openBox('INBOX', false, cb);
    }
    
    imap.once('ready', function() {
      openInbox(function(err, box) {
        if (err) return reject(err);
        imap.search(['UNSEEN', ['FROM', 'ablak@usetwelve.com']], function(err, results) {
          if (err) return reject(err);
    
          if (results.length === 0) {
            console.log('No emails found.');
            imap.end();
            return resolve('No new emails.');
          }
    
          const fetch = imap.fetch(results, { bodies: '' });
    
          fetch.on('message', function(msg, seqno) {
            let email = { seqno: seqno, body: { name: String, amount: Number, comment: String } };
            let buffer = '';
    
            msg.on('body', function(stream, info) {
              stream.on('data', function(chunk) {
                buffer += chunk.toString('utf8');
              });
    
              stream.once('end', async function() {});
            });
    
            //mark attributes email as read
            msg.once('attributes', function(attrs) {
              let uid = attrs.uid;
              imap.addFlags(uid, ['\\Seen'], function (err) {
                  if (err) {
                      console.log(err);
                  } else {
                      console.log("Done, marked email as read!")
                  }
              });
            });
    
            msg.once('end', async function() {
              

              try {
                if (buffer.length > 0) {

                  const parsed = (await simpleParser(buffer)).html;
                  const $ = cheerio.load(parsed);

                  let senderInfo = $('td[style="font-size:36px;font-family:Connections,arial;color:#000000;padding-bottom:0px;padding-top:20px;float:center;text-align:center"]').text().trim();
                  let [fullName, amount] = senderInfo.split(' sent you ');
                  
                  amount = amount.replace('$', '');
                  
                  let comment = $('td[colspan="2"][style="padding-bottom:0px;padding-top:40px;font-family:Connections,arial;font-weight:normal;text-align:center;font-size:22px;line-height:28px;color:#000000"]').text().trim();
                  
                  if(comment === "") {
                    comment = "comment empty";
                  }        

                  email.body = { name: fullName, amount: amount, comment: comment };
    
                  emailData.push(email);
                } else {
                  console.log(`Message #${seqno} buffer is empty`);
                }
    
                if (emailData.length === results.length) {
                  saveNewEmailsReceived(emailData, resolve, reject);
                }
              } catch (err) {
                console.error('Error parsing email:', err);
                reject(err);
              }
            });
          });
    
          fetch.once('error', function(err) {
            console.log('Fetch error: ' + err);
            reject(err);
          });
    
          fetch.once('end', function() {
            console.log('End of fetch.');
            imap.end();
          });
        });
      });
    });
    
    imap.once('error', function(err) {
      console.log(err);
      reject(err);
    });
    
    imap.once('end', function() {
      console.log('Connection closed.');
    });
    
    imap.connect();
    
    function saveNewEmailsReceived(data, resolve, reject) {

      data.forEach(item => {
        informationModel.create(item.body)
        .then((data) => {
          console.log("Created Successfully...");
          resolve(data);
        }).catch((err) => {
          console.log(err);
          reject({ error: err, msg: "Something went wrong!" });
        });
      });
    }
  });
};

module.exports.saveInformations = async (req, res) => {

    const objectInformation = req.body
    informationModel.create(objectInformation)
    .then((data) => {
        console.log("Saved Successfully");
        res.status(201).send(data)
    }).catch((err) => {
        console.log(err);
        res.send({error: err, msg: "Something went wrong!"})
    })
}

module.exports.updateInformations = async (req, res) => {

    const {id} = req.params
    const objectInformation = req.body
    // const { name } = req.body

    informationModel.findByIdAndUpdate(id, objectInformation)
    .then(() => res.send("Updated Successfully"))
    .catch((err) => {
        console.log(err);
        res.send({error: err, msg: "Something went wrong!"})
    })
}

module.exports.deleteInformations = async (req, res) => {

    const {id} = req.params

    informationModel.findByIdAndDelete(id)
    .then(() => res.send("Deleted Successfully"))
    .catch((err) => {
        console.log(err);
        res.send({error: err, msg: "Something went wrong!"})
    })
}