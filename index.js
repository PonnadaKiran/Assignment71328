// Import necessary modules and credentials from external file
const { google } = require("googleapis");
const { CLIENT_ID_ALT, CLIENT_SECRET_ALT, REDIRECT_URI_ALT, REFRESH_TOKEN_ALT } = require("./alternate_credentials");

// Create OAuth2 client with provided credentials
const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID_ALT, CLIENT_SECRET_ALT, REDIRECT_URI_ALT
);

// Set OAuth2 client credentials with the refresh token
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN_ALT });

// Set to keep track of replied emails to avoid duplication
const repliedMails = new Set();

// Function to check unread emails, reply, and add a label
async function emailCheckAndSendMsgs() {
    try {
        // Create Gmail API client
        const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

        // Fetch unread emails
        const res = await gmail.users.messages.list({
            userId: "me",
            q: "is:unread",
        });
        const msgs = res.data.messages;

        if (msgs && msgs.length > 0) {
            for (const msg of msgs) {
                // Fetch detailed information about the email
                const email = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id,
                });

                // Extract sender, recipient, and subject from email headers
                const from = email.data.payload.headers.find(
                    (header) => header.name === "From"
                );
                const toHeader = email.data.payload.headers.find(
                    (header) => header.name === "To"
                );
                const subject = email.data.payload.headers.find(
                    (header) => header.name === "Subject"
                );
                const From = from.value;
                const toEmail = toHeader.value;
                const emailSubject = subject.value;

                console.log("Email received from:", From);
                console.log("To Email:", toEmail);

                // Check if the email has already been replied to
                if (repliedMails.has(From)) {
                    console.log("Already replied to:", From);
                    continue;
                }

                // Fetch the email thread to check for existing replies
                const thread = await gmail.users.threads.get({
                    userId: "me",
                    id: email.data.threadId,
                });

                // Extract replies from the thread
                const replies = thread.data.messages.slice(1);

                // If no existing replies, send a new reply
                if (replies.length === 0) {
                    // Send a reply email
                    await gmail.users.messages.send({
                        userId: "me",
                        requestBody: {
                            raw: await replySending(toEmail, From, emailSubject),
                        },
                    });

                    // Add a label to the original email
                    const labelName = "onVacationTime";
                    await gmail.users.messages.modify({
                        userId: "me",
                        id: msg.id,
                        requestBody: {
                            addLabelIds: [await labelCreation(labelName)],
                        },
                    });

                    console.log("Sent a reply to email:", From);
                    // Add sender to the set to mark as replied
                    repliedMails.add(From);
                }
            }
        }
    } catch (error) {
        console.log("Error occurred:", error);
    }
}

// Function to create and return a base64 encoded reply email
async function replySending(from, to, subject) {
    const emailContent = `From: ${from} \nTo: ${to} \nSubject: ${subject}\n\nThank you for reaching out. I hope this message finds you well. Currently, I am out of the office and unable to respond to emails promptly.\n\nYour patience is highly appreciated, and I will make it a priority to respond to your inquiry as soon as I return.`;
    
    const base64EncodedEmail = Buffer.from(emailContent)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\+/g, "_");

    return base64EncodedEmail;
}

// Function to create a Gmail label if it doesn't exist and return its ID
async function labelCreation(labelName) {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // Fetch existing labels
    const res = await gmail.users.labels.list({ userId: "me" });
    const labels = res.data.labels;

    // Check if the label already exists
    const existingLabel = labels.find((label) => label.name === labelName);
    if (existingLabel) {
        return existingLabel.id;
    }

    // Create a new label if it doesn't exist
    const newLabel = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
            name: labelName,
            labelListVisibility: "labelShow",
            messageListVisibility: "show",
        },
    });

    return newLabel.data.id;
}

// Function to generate a random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Set up an interval to periodically check and reply to emails
setInterval(emailCheckAndSendMsgs, randomInt(45, 120) * 1000);
