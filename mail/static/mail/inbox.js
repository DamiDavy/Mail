document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  //send email
  const recipients = document.querySelector('#compose-recipients');
  const subject = document.querySelector('#compose-subject');
  const body = document.querySelector('#compose-body');

  //creating new email
  document.querySelector('#compose-form').onsubmit = () => {

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients.value,
        subject: subject.value,
        body: body.value
      })
    })
    .then(response => response.json())
    .then(result => {
      load_mailbox('sent')
    });
    return false;
  }

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //get mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then((emails) => {
    // get emails
    emails.forEach((item) => {
      num = item["id"];
      const element = document.createElement("div");
      const title = document.createElement("span");
      //if email in sent show recipients
      if (mailbox === "sent") {
        title.innerHTML = "<b>" + item["recipients"] + "</b> " + item["subject"]; 
        element.style.background = "#fff";
      }
      //else show sender
      else {
        title.innerHTML = "<b>" + item["sender"] + "</b> " + item["subject"];

        /*archive
        const archive = document.createElement("button");
        archive.classList.add("archive");

        if (mailbox === "inbox") {
          archive.innerHTML = "Archive";
        }
        else {
          archive.innerHTML = "Unarchive";
        }
        element.append(archive);
        archive.addEventListener('click', () => {
          archive.parentElement.style.display = 'none';
          archived(num);
        });*/
      }

      //style
      element.classList.add("mail-link");
      if (item["read"] === true) {
        element.style.background = "#eee"
      }

      //add time and date
      const time = document.createElement("span");
      time.innerHTML = item["timestamp"];
      time.classList.add("mail-time");
      element.append(title);
      element.append(time);
      document.querySelector('#emails-view').append(element);

      title.classList.add("mail-pointer");
      title.addEventListener('click', () => load_mail(item));
    });
  });
};

//single mail info
function load_mail(item) {

  // Show the mailview and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  num = item["id"];

  fetch(`/emails/${num}`)
  .then(response => response.json())
  .then(email => {
    //show current email
    const element = document.querySelector('#email-detail');
    element.innerHTML = "From: " + email["sender"] + "<br>To: " + email["recipients"] + "<br>Subject: " + email["subject"] + "<br>Timestamp: " + 
    email["timestamp"] + "<br>";
    const body = document.createElement("p");
    body.innerHTML = "<hr>" + email["body"] + "<hr>";
    element.append(body);

    //make email read in db
    fetch(`/emails/${num}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })

    if (email["sender"] != email["user"]) {
      //reply
      const reply = document.createElement("button");
      reply.innerHTML = "Reply";
      reply.classList.add("btn", "btn-sm", "btn-outline-primary", "reply");
      element.append(reply);
      reply.addEventListener('click', () => doreply(item));
    }

    //archive
    const archive = document.createElement("button");

    if (!email["archived"]) {
      archive.innerHTML = "Archive";
    }
    else {
      archive.innerHTML = "Unarchive";
    }
    archive.classList.add("btn", "btn-sm", "btn-outline-primary");
    element.append(archive);

    if (!email["archived"]) {
      archive.addEventListener('click', () => {
        archived(num);
      });
    }
    else {
      archive.addEventListener('click', () => {
        unarchived(num);
      });
    }
  })
}


//function for archieving/unarchieving
function archived(num) {
  fetch('/emails/inbox')
  .then(response => response.json())
  .then((emails) => {
    emails.forEach((item) => {
      fetch(`/emails/${num}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        })
      })
    })
    load_mailbox('inbox')
  })
}


function unarchived(num) {
  fetch('/emails/archive')
  .then(response => response.json())
  .then((emails) => {
    emails.forEach((item) => {
      fetch(`/emails/${num}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
      })
    })
  })
  fetch('/emails/inbox')
  .then(response => response.json())
  .then((emails) => {
    load_mailbox('inbox')
  })
} 

function doreply(email) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Prefill composition fields
  document.querySelector('#compose-recipients').value = email["sender"];
  document.querySelector('#compose-sender').value = email["user"];
  const subject = email["subject"];
  if (subject.slice(0, 2) != "Re") {
    document.querySelector('#compose-subject').value = "Re: " + subject;
  }
  else {
    document.querySelector('#compose-subject').value = subject;
  }
  document.querySelector('#compose-body').value = `\n\n\nOn ${email["timestamp"]}, ${email["sender"]} wrote: ${email["body"]}`;
}