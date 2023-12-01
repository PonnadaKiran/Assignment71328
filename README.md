# Gmail Autoresponder

This script uses the Gmail API to check for unread emails, and if there are any, it sends an automated reply. The script is designed to run periodically using a set interval.

## Prerequisites

- Node.js installed on your machine
- Gmail API credentials (client ID, client secret, redirect URI, and refresh token)

## Installation

1. Clone this repository.
2. Install dependencies using `npm install`.
3. Set up your Gmail API credentials by creating a file named `alternate_credentials.js` with your credentials.

## Usage

Run the script using `npm start`. It will periodically check for unread emails and send automated replies.

## Configuration

- Adjust the interval by modifying the `setInterval` function parameters in the script.
- Customize the automated reply message in the `replySending` function.
