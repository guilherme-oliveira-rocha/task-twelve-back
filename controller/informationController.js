const informationModel = require("../model/informationModel")
const PASSWORD_GMAIL = process.env.PASSWORD_GMAIL

module.exports.getInformations = async (req, res) => {
    const info = await informationModel.find()
    res.send(info)
}

module.exports.searchInformations = async (req, res) => {

  const searchName = req.body.name

  const info = await informationModel.find({'name' : new RegExp(searchName, 'i')})
  res.send(info)
}

module.exports.getNewEmailsReceived = (req, res) => {

  const Imap = require('node-imap');
  const { simpleParser } = require('mailparser');
  
  const imap = new Imap({
    user: 'guilherme.dev12@gmail.com',
    password: `${PASSWORD_GMAIL}`,
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
      if (err) throw err;
      imap.search(['UNSEEN', ['FROM', 'ablak@usetwelve.com']], function(err, results) {
        if (err) throw err;
  
        if (results.length === 0) {
          console.log('No emails found.');
          imap.end();
          return;
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
                const parsed = (await simpleParser(buffer)).text;
  
                const arrHtmlBodyEmail = parsed.split(/\n/);
                const arrEspecificMsg = [];
  
                let comment = "";
  
                arrHtmlBodyEmail.forEach((info, index) => {
                  if (info.includes('sent')) {
                    arrEspecificMsg.push(info);
                    comment = arrHtmlBodyEmail[index + 1];
                  }
                });
  
                const getLastEspecificfMsg = arrEspecificMsg.at(-1);
                const arrGetLastEspecificMsg = getLastEspecificfMsg.split(/[\s$]+/);
  
                const name = arrGetLastEspecificMsg[0] + " " + arrGetLastEspecificMsg[1];
                const amount = parseFloat(arrGetLastEspecificMsg.at(-1));
                email.body = { name: name, amount: amount, comment: comment };
  
                emailData.push(email);
              } else {
                console.log(`Message #${seqno} buffer is empty`);
              }
  
              if (emailData.length === results.length) {
                saveNewEmailsReceived(emailData);
              }
            } catch (err) {
              console.error('Error parsing email:', err);
            }
          });
        });
  
        fetch.once('error', function(err) {
          console.log('Fetch error: ' + err);
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
  });
  
  imap.once('end', function() {
    console.log('Connection closed.');
  });
  
  imap.connect();
  
  function saveNewEmailsReceived(data) {
    const objectInformation = data[0].body
    informationModel.create(objectInformation)
      .then((data) => {
        console.log("Created Successfully...");
        res.status(201).send(data)
      }).catch((err) => {
        console.log(err);
        res.send({ error: err, msg: "Something went wrong!" })
      })
  }
}

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